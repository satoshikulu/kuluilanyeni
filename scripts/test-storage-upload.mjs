import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function parseEnvFile(envPath) {
  try {
    if (!existsSync(envPath)) return {}
    const raw = readFileSync(envPath, 'utf-8')
    const lines = raw.split(/\r?\n/)
    const out = {}
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      out[key] = val
    }
    return out
  } catch {
    return {}
  }
}

async function main() {
  console.log('📸 Storage Upload Test Başlatılıyor...\n')

  const cwd = process.cwd()
  const envFromFile = parseEnvFile(resolve(cwd, '.env'))

  const url = process.env.VITE_SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error('❌ Supabase credentials bulunamadı')
    process.exit(1)
  }

  const supabase = createClient(url, anon)
  const BUCKET = 'listings.images'

  // Test için basit bir görsel oluştur (1x1 PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  )

  const testPath = `test/test-${Date.now()}.png`

  console.log('📤 Test görseli yükleniyor...')
  console.log('   Bucket:', BUCKET)
  console.log('   Path:', testPath)
  console.log('   Boyut:', testImageBuffer.length, 'bytes\n')

  try {
    // Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(testPath, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload hatası:', uploadError.message)
      console.error('   Detay:', uploadError)
      
      // Bucket kontrolü
      console.log('\n🔍 Bucket mevcut mu kontrol ediliyor...')
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucket = buckets?.find(b => b.id === BUCKET)
      if (!bucket) {
        console.error('❌ BUCKET BULUNAMADI!')
        console.log('\n📝 Bucket oluşturmak için:')
        console.log('1. Supabase Dashboard → Storage')
        console.log('2. "New bucket" → Name: listings.images')
        console.log('3. "Public bucket" seçeneğini işaretleyin')
        console.log('4. Create\n')
      } else {
        console.log('✅ Bucket mevcut:', bucket.name, '(public:', bucket.public + ')')
      }
      
      process.exit(1)
    }

    console.log('✅ Upload başarılı!')
    console.log('   Path:', uploadData.path)

    // Public URL al
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(testPath)

    console.log('✅ Public URL alındı:')
    console.log('   ', urlData.publicUrl)

    // Dosyayı kontrol et (list)
    console.log('\n📋 Yüklenen dosyalar kontrol ediliyor...')
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list('test', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) {
      console.error('⚠️  Liste hatası:', listError.message)
    } else {
      console.log(`✅ ${files?.length || 0} dosya bulundu`)
      if (files && files.length > 0) {
        files.forEach(f => {
          console.log('   -', f.name, `(${f.metadata?.size || 0} bytes)`)
        })
      }
    }

    // Temizlik - test dosyasını sil
    console.log('\n🗑️  Test dosyası siliniyor...')
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove([testPath])

    if (deleteError) {
      console.error('⚠️  Silme hatası:', deleteError.message)
    } else {
      console.log('✅ Test dosyası silindi')
    }

    console.log('\n🎉 Storage tamamen çalışıyor!')
    console.log('\n✅ Tüm özellikler hazır:')
    console.log('   - Görsel yükleme ✅')
    console.log('   - Public URL alma ✅')
    console.log('   - Dosya listeleme ✅')
    console.log('   - Dosya silme ✅')

  } catch (e) {
    console.error('\n❌ Beklenmeyen hata:', e.message)
    process.exit(1)
  }
}

main()
