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

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for uploads');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

const createSupabaseStorage = () => ({
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
});

module.exports = { createSupabaseStorage };
