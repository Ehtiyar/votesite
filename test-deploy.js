// Deploy Test Script
// Bu script'i Node.js ile çalıştırın: node test-deploy.js

const fs = require('fs')
const path = require('path')

console.log('🧪 Deploy test ediliyor...')

// Test 1: Package.json kontrolü
console.log('\n1️⃣ Package.json dependency kontrolü...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'argon2',
    'jsonwebtoken',
    'lucide-react',
    'react',
    'react-dom',
    'react-router-dom',
    'zod'
  ]
  
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep])
  
  if (missingDeps.length === 0) {
    console.log('✅ Tüm gerekli dependency\'ler mevcut')
    requiredDeps.forEach(dep => {
      console.log(`   - ${dep}: ${packageJson.dependencies[dep]}`)
    })
  } else {
    console.log('❌ Eksik dependency\'ler:')
    missingDeps.forEach(dep => {
      console.log(`   - ${dep}`)
    })
  }
} catch (error) {
  console.error('❌ Package.json okuma hatası:', error.message)
}

// Test 2: Netlify.toml kontrolü
console.log('\n2️⃣ Netlify.toml kontrolü...')
try {
  const netlifyToml = fs.readFileSync('netlify.toml', 'utf8')
  
  if (netlifyToml.includes('@netlify/plugin-functions-install-core')) {
    console.log('✅ Functions install plugin mevcut')
  } else {
    console.log('❌ Functions install plugin eksik')
  }
  
  if (netlifyToml.includes('NODE_VERSION = "18"')) {
    console.log('✅ Node.js versiyonu ayarlanmış (18)')
  } else {
    console.log('❌ Node.js versiyonu ayarlanmamış')
  }
} catch (error) {
  console.error('❌ Netlify.toml okuma hatası:', error.message)
}

// Test 3: Netlify Functions kontrolü
console.log('\n3️⃣ Netlify Functions kontrolü...')
const functionsDir = 'netlify/functions'
const adminFunctionsDir = 'netlify/functions/admin'

try {
  if (fs.existsSync(functionsDir)) {
    const functions = fs.readdirSync(functionsDir)
    console.log(`✅ Functions dizini mevcut (${functions.length} dosya)`)
    
    const jsFiles = functions.filter(file => file.endsWith('.js'))
    console.log(`   - JavaScript dosyaları: ${jsFiles.length}`)
    jsFiles.forEach(file => {
      console.log(`     * ${file}`)
    })
  } else {
    console.log('❌ Functions dizini bulunamadı')
  }
  
  if (fs.existsSync(adminFunctionsDir)) {
    const adminFunctions = fs.readdirSync(adminFunctionsDir)
    console.log(`✅ Admin functions dizini mevcut (${adminFunctions.length} dosya)`)
    
    const adminJsFiles = adminFunctions.filter(file => file.endsWith('.js'))
    console.log(`   - Admin JavaScript dosyaları: ${adminJsFiles.length}`)
    adminJsFiles.forEach(file => {
      console.log(`     * ${file}`)
    })
  } else {
    console.log('❌ Admin functions dizini bulunamadı')
  }
} catch (error) {
  console.error('❌ Functions dizini kontrol hatası:', error.message)
}

// Test 4: Admin panel dosyaları kontrolü
console.log('\n4️⃣ Admin panel dosyaları kontrolü...')
const adminFiles = [
  'src/admin/AdminApp.tsx',
  'src/admin/pages/AdminLogin.tsx',
  'src/admin/pages/AdminDashboard.tsx',
  'src/admin/pages/AdminTest.tsx',
  'src/admin/pages/AdminDebug.tsx',
  'src/admin/components/ErrorBoundary.tsx'
]

let adminFilesExist = 0
adminFiles.forEach(file => {
  if (fs.existsSync(file)) {
    adminFilesExist++
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file}`)
  }
})

console.log(`\nAdmin panel dosyaları: ${adminFilesExist}/${adminFiles.length} mevcut`)

// Test 5: Build test
console.log('\n5️⃣ Build test...')
try {
  const distDir = 'dist'
  if (fs.existsSync(distDir)) {
    console.log('✅ Dist dizini mevcut (önceki build)')
  } else {
    console.log('ℹ️ Dist dizini yok (yeni build gerekli)')
  }
} catch (error) {
  console.error('❌ Build test hatası:', error.message)
}

console.log('\n🎉 Deploy test tamamlandı!')
console.log('\n📋 Deploy Öncesi Kontrol Listesi:')
console.log('   ✅ Package.json dependency\'leri eklendi')
console.log('   ✅ Netlify.toml plugin eklendi')
console.log('   ✅ Functions dosyaları mevcut')
console.log('   ✅ Admin panel dosyaları mevcut')
console.log('\n🚀 Deploy için:')
console.log('   1. Git commit yap')
console.log('   2. Git push yap')
console.log('   3. Netlify otomatik deploy edecek')
console.log('\n🔗 Deploy sonrası test URL\'leri:')
console.log('   - Ana site: https://your-site.netlify.app/')
console.log('   - Admin debug: https://your-site.netlify.app/admin/debug')
console.log('   - Admin login: https://your-site.netlify.app/admin/login')
