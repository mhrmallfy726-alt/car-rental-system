const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase uploads');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const folderForField = (fieldname) => {
  const folders = {
    images: 'cars',
    avatar: 'avatars',
    id_card: 'documents/id-card',
    driver_license: 'documents/driver-license',
    commercial_register: 'documents/commercial-register',
    owner_id: 'documents/owner-id',
    attachment: 'complaints',
  };

  if (fieldname === 'image') return 'advertisements';
  return folders[fieldname] || 'uploads';
};

const createSupabaseStorage = () => ({
  _handleFile(req, file, callback) {
    const chunks = [];
    let size = 0;

    file.stream.on('data', (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
    });

    file.stream.on('error', callback);

    file.stream.on('end', async () => {
      try {
        const extension = path.extname(file.originalname || '').toLowerCase();
        const storagePath = `${folderForField(file.fieldname)}/${uuidv4()}${extension}`;
        const buffer = Buffer.concat(chunks);

        const { error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const publicUrl = data.publicUrl;

        callback(null, {
          destination: bucket,
          filename: publicUrl,
          path: publicUrl,
          url: publicUrl,
          storagePath,
          size,
        });
      } catch (error) {
        callback(error);
      }
    });
  },

  _removeFile(_req, _file, callback) {
    callback(null);
  },
});

module.exports = { createSupabaseStorage };
