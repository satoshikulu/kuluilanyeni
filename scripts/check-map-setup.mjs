import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 Harita Kurulum Kontrolü\n')
console.log('═'.repeat(50))

// 1. Dosya kontrolü
console.log('\n📁 Dosya Kontrolü:')
const files = [
  'src/components/LocationPicker.tsx',
  'src/components/LocationPickerWrapper.tsx',
  'src/components/LocationMap.tsx',
  'src/pages/SubmitListingPage.tsx',
  'src/main.tsx'
]

files.forEach(file => {
  const path = join(__dirname, '..', file)
  const exists = existsSync(path)
  console.log(`   ${exists ? '✅' : '❌'} ${file}`)
})

// 2. main.tsx CSS import kontrolü
console.log('\n📦 CSS Import Kontrolü:')
const mainPath = join(__dirname, '..', 'src', 'main.tsx')
const mainContent = readFileSync(mainPath, 'utf-8')
const hasLeafletCSS = mainContent.includes("import 'leaflet/dist/leaflet.css'")
console.log(`   ${hasLeafletCSS ? '✅' : '❌'} Leaflet CSS import edilmiş`)

if (!hasLeafletCSS) {
  console.log('\n   ⚠️  UYARI: Leaflet CSS import edilmemiş!')
  console.log('   Çözüm: src/main.tsx dosyasına ekle:')
  console.log("   import 'leaflet/dist/leaflet.css'")
}

// 3. SubmitListingPage LocationPicker kontrolü
console.log('\n🗺️  LocationPicker Kullanımı:')
const submitPath = join(__dirname, '..', 'src', 'pages', 'SubmitListingPage.tsx')
const submitContent = readFileSync(submitPath, 'utf-8')
const hasLocationPickerImport = submitContent.includes('LocationPicker')
const hasLocationPickerWrapper = submitContent.includes('LocationPickerWrapper')
console.log(`   ${hasLocationPickerImport ? '✅' : '❌'} LocationPicker import edilmiş`)
console.log(`   ${hasLocationPickerWrapper ? '✅' : '❌'} LocationPickerWrapper kullanılıyor`)

// 4. package.json kontrol
console.log('\n📦 Paket Kontrolü:')
const packagePath = join(__dirname, '..', 'package.json')
const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'))
const deps = { ...packageContent.dependencies, ...packageContent.devDependencies }

const requiredPackages = {
  'leaflet': '1.9.4',
  'react-leaflet': '5.0.0',
  '@types/leaflet': 'any'
}

Object.entries(requiredPackages).forEach(([pkg, version]) => {
  const installed = deps[pkg]
  const hasPackage = !!installed
  console.log(`   ${hasPackage ? '✅' : '❌'} ${pkg}${hasPackage ? ` (${installed})` : ''}`)
  
  if (!hasPackage) {
    console.log(`      ⚠️  Eksik! Yüklemek için: npm install ${pkg}`)
  }
})

// 5. Özet
console.log('\n' + '═'.repeat(50))
console.log('\n📊 ÖZET:')

const allChecks = [
  hasLeafletCSS,
  hasLocationPickerImport,
  hasLocationPickerWrapper,
  !!deps['leaflet'],
  !!deps['react-leaflet']
]

const passedChecks = allChecks.filter(Boolean).length
const totalChecks = allChecks.length

console.log(`   ${passedChecks}/${totalChecks} kontrol başarılı`)

if (passedChecks === totalChecks) {
  console.log('\n✅ Tüm kontroller başarılı!')
  console.log('\n🚀 Yapılacaklar:')
  console.log('   1. Dev server\'ı yeniden başlat: npm run dev')
  console.log('   2. Tarayıcıyı hard refresh yap: Ctrl+Shift+R')
  console.log('   3. /ilan-ver sayfasına git')
  console.log('   4. Harita bölümünü kontrol et')
} else {
  console.log('\n⚠️  Bazı kontroller başarısız!')
  console.log('\n🔧 Yapılacaklar:')
  
  if (!hasLeafletCSS) {
    console.log('   1. src/main.tsx dosyasına ekle:')
    console.log("      import 'leaflet/dist/leaflet.css'")
  }
  
  if (!deps['leaflet'] || !deps['react-leaflet']) {
    console.log('   2. Paketleri yükle:')
    console.log('      npm install leaflet@1.9.4 react-leaflet@5.0.0 @types/leaflet')
  }
  
  console.log('   3. Dev server\'ı yeniden başlat: npm run dev')
}

console.log('\n' + '═'.repeat(50))
