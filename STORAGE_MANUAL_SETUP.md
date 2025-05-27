# Manual Storage Policy Setup (Supabase UI)

If you're getting "must be owner of the table" errors when running SQL scripts, you can set up storage policies manually through the Supabase dashboard.

## 🎯 Quick Fix Steps

### Step 1: Access Storage Settings
1. Go to your Supabase dashboard
2. Navigate to **Storage** → **Policies**
3. You'll see the `objects` table where you can manage policies

### Step 2: Create Policies for Images Bucket

Click **"New Policy"** and create these policies one by one:

#### Policy 1: User Upload Images
- **Policy Name**: `user_upload_images`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **USING expression**: (leave empty)
- **WITH CHECK expression**:
```sql
bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 2: User View Images
- **Policy Name**: `user_view_images`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
```
- **WITH CHECK expression**: (leave empty)

#### Policy 3: User Delete Images
- **Policy Name**: `user_delete_images`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Public View Images
- **Policy Name**: `public_view_images`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **USING expression**:
```sql
bucket_id = 'images'
```

### Step 3: Create Policies for Documents Bucket

#### Policy 5: User Upload Documents
- **Policy Name**: `user_upload_documents`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **WITH CHECK expression**:
```sql
bucket_id = 'aeronotes-documents' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 6: User View Documents
- **Policy Name**: `user_view_documents`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'aeronotes-documents' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 7: User Delete Documents
- **Policy Name**: `user_delete_documents`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **USING expression**:
```sql
bucket_id = 'aeronotes-documents' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 8: Public View Documents
- **Policy Name**: `public_view_documents`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **USING expression**:
```sql
bucket_id = 'aeronotes-documents'
```

## 📋 Alternative: Using Supabase CLI

If you have admin access or service role permissions, you can also:

1. **Enable RLS** (if not already enabled):
   - Go to Database → Tables → `storage.objects`
   - Click the settings icon → Enable RLS

2. **Run the SQL script** with elevated permissions:
   ```bash
   supabase sql --file scripts/fix-storage-policies-supabase.sql
   ```

## ✅ Verification

After creating all policies:

1. **Test Upload**: Try uploading a file through your app
2. **Check Storage**: Go to Storage → browse your buckets
3. **Verify Structure**: Files should appear in `{bucket}/{user_id}/filename` format

## 🔍 Troubleshooting Policy Creation

If you have issues creating policies:

1. **Check Bucket Names**: Ensure buckets `images` and `aeronotes-documents` exist
2. **Verify Roles**: Make sure you're using `authenticated` and `public` correctly
3. **Test Expressions**: Use the "Test" feature in the policy editor
4. **Review Syntax**: Double-check the SQL expressions for typos

## 📝 Notes

- Each policy controls one specific operation (INSERT, SELECT, DELETE)
- The `(storage.foldername(name))[1]` extracts the first folder from the file path
- This ensures users can only access files in their own user ID folder
- Public policies allow read access for sharing files

Once all policies are created, your file uploads should work without permission errors! 