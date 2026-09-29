const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
// Supabase now also labels the server-side key as a secret key. Prefer the
// explicit service-role variable for backwards compatibility, then accept the
// newer secret-key variable used by the current dashboard.
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
)?.trim();
const bucket = (process.env.SUPABASE_STORAGE_BUCKET || 'uploads').trim();
const hasSupabaseConfig = Boolean(supabaseUrl && serviceRoleKey);
const uploadsDirectory = path.join(__dirname, '../../uploads');

const folderForField = (fieldname) => ({
  images: 'cars',
  avatar: 'avatars',
  id_card: 'documents/id-card',
  driver_license: 'documents/driver-license',
  commercial_register: 'documents/commercial-register',
  owner_id: 'documents/owner-id',
  attachment: 'complaints',
  image: 'advertisements',
}[fieldname] || 'uploads');

const createLocalStorage = () => ({
  _handleFile(_req, file, callback) {
    const folder = folderForField(file.fieldname);
    const destination = path.join(uploadsDirectory, folder);
    const filename = `${uuidv4()}${path.extname(file.originalname || '').toLowerCase()}`;
    const diskPath = path.join(destination, filename);
    const publicPath = `/uploads/${folder}/${filename}`;

    fs.mkdir(destination, { recursive: true }, (mkdirError) => {
      if (mkdirError) return callback(mkdirError);

      const output = fs.createWriteStream(diskPath, { flags: 'wx' });
      file.stream.pipe(output);
      output.on('error', (error) => {
        fs.unlink(diskPath, () => callback(error));
      });
      output.on('finish', () => callback(null, {
        destination,
        filename: publicPath,
        path: publicPath,
        url: publicPath,
        storagePath: diskPath,
        size: output.bytesWritten,
      }));
    });
  },
  _removeFile(_req, file, callback) {
    if (!file.storagePath) return callback(null);
    fs.unlink(file.storagePath, (error) => callback(error?.code === 'ENOENT' ? null : error));
  },
});

const createSupabaseStorage = () => {
  if (!hasSupabaseConfig) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for production uploads');
    }
    console.warn('Supabase Storage is not configured; using local backend/uploads storage.');
    return createLocalStorage();
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    _handleFile(_req, file, callback) {
      const chunks = [];
      let size = 0;
      file.stream.on('data', (chunk) => { chunks.push(chunk); size += chunk.length; });
      file.stream.on('error', callback);
      file.stream.on('end', async () => {
        try {
          const extension = path.extname(file.originalname || '').toLowerCase();
          const storagePath = `${folderForField(file.fieldname)}/${uuidv4()}${extension}`;
          const { error } = await supabase.storage.from(bucket).upload(storagePath, Buffer.concat(chunks), {
            contentType: file.mimetype,
            upsert: false,
          });
          if (error) throw error;
          const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
          callback(null, {
            destination: bucket,
            filename: data.publicUrl,
            path: data.publicUrl,
            url: data.publicUrl,
            storagePath,
            size,
          });
        } catch (error) {
          callback(error);
        }
      });
    },
    _removeFile(_req, _file, callback) { callback(null); },
  };
};

module.exports = { createSupabaseStorage };
