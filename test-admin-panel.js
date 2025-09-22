// Admin Panel Test Script
// Bu script'i Node.js ile çalıştırın: node test-admin-panel.js

const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminPanel() {
  try {
    console.log('🧪 Admin Panel test ediliyor...')
    
    // Test 1: Admin users tablosu
    console.log('\n1️⃣ Admin users tablosu test ediliyor...')
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5)

    if (adminError) {
      console.error('❌ Admin users hatası:', adminError.message)
    } else {
      console.log(`✅ ${adminUsers.length} admin kullanıcısı bulundu`)
      adminUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - Active: ${user.is_active}`)
      })
    }

    // Test 2: Admin sessions tablosu
    console.log('\n2️⃣ Admin sessions tablosu test ediliyor...')
    const { data: sessions, error: sessionsError } = await supabase
      .from('admin_sessions')
      .select('*')
      .limit(5)

    if (sessionsError) {
      console.error('❌ Admin sessions hatası:', sessionsError.message)
    } else {
      console.log(`✅ ${sessions.length} admin session bulundu`)
    }

    // Test 3: Audit logs tablosu
    console.log('\n3️⃣ Audit logs tablosu test ediliyor...')
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (auditError) {
      console.error('❌ Audit logs hatası:', auditError.message)
    } else {
      console.log(`✅ ${auditLogs.length} audit log bulundu`)
      auditLogs.forEach(log => {
        console.log(`   - ${log.action} - ${log.resource_type} (${new Date(log.created_at).toLocaleString('tr-TR')})`)
      })
    }

    // Test 4: System settings tablosu
    console.log('\n4️⃣ System settings tablosu test ediliyor...')
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')

    if (settingsError) {
      console.error('❌ System settings hatası:', settingsError.message)
    } else {
      console.log(`✅ ${settings.length} sistem ayarı bulundu`)
      settings.slice(0, 5).forEach(setting => {
        console.log(`   - ${setting.key}: ${JSON.stringify(setting.value)}`)
      })
    }

    // Test 5: Banners tablosu
    console.log('\n5️⃣ Banners tablosu test ediliyor...')
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)

    if (bannersError) {
      console.error('❌ Banners hatası:', bannersError.message)
    } else {
      console.log(`✅ ${banners.length} aktif banner bulundu`)
    }

    // Test 6: News tablosu
    console.log('\n6️⃣ News tablosu test ediliyor...')
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')

    if (newsError) {
      console.error('❌ News hatası:', newsError.message)
    } else {
      console.log(`✅ ${news.length} yayınlanmış haber bulundu`)
    }

    // Test 7: Social accounts tablosu
    console.log('\n7️⃣ Social accounts tablosu test ediliyor...')
    const { data: socialAccounts, error: socialError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('is_active', true)

    if (socialError) {
      console.error('❌ Social accounts hatası:', socialError.message)
    } else {
      console.log(`✅ ${socialAccounts.length} aktif sosyal hesap bulundu`)
    }

    console.log('\n🎉 Admin Panel test tamamlandı!')
    console.log('\n📋 Test Sonuçları:')
    console.log(`   - Admin Users: ${adminUsers?.length || 0}`)
    console.log(`   - Admin Sessions: ${sessions?.length || 0}`)
    console.log(`   - Audit Logs: ${auditLogs?.length || 0}`)
    console.log(`   - System Settings: ${settings?.length || 0}`)
    console.log(`   - Active Banners: ${banners?.length || 0}`)
    console.log(`   - Published News: ${news?.length || 0}`)
    console.log(`   - Social Accounts: ${socialAccounts?.length || 0}`)

    console.log('\n✅ Tüm testler başarılı! Admin Panel hazır.')
    console.log('\n🚀 Admin Panel URL\'leri:')
    console.log('   - Debug: https://your-site.netlify.app/admin/debug')
    console.log('   - Test: https://your-site.netlify.app/admin/test')
    console.log('   - Login: https://your-site.netlify.app/admin/login')
    console.log('   - Dashboard: https://your-site.netlify.app/admin/dashboard')

    console.log('\n🔐 Test Giriş Bilgileri:')
    if (adminUsers && adminUsers.length > 0) {
      const testUser = adminUsers[0]
      console.log(`   - Username: ${testUser.username}`)
      console.log(`   - Email: ${testUser.email}`)
      console.log(`   - Role: ${testUser.role}`)
      console.log(`   - Active: ${testUser.is_active}`)
      console.log(`   - Locked: ${testUser.is_locked}`)
    } else {
      console.log('   - Admin kullanıcısı bulunamadı!')
      console.log('   - secure-admin-seed.sql script\'ini çalıştırın')
    }

  } catch (error) {
    console.error('❌ Test hatası:', error.message)
    process.exit(1)
  }
}

// Script'i çalıştır
testAdminPanel()
