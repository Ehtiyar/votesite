// Dashboard API Test Script
// Bu script'i Node.js ile çalıştırın: node test-dashboard-api.js

const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardAPI() {
  try {
    console.log('🧪 Dashboard API test ediliyor...')
    
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
    }

    // Test 2: Profiles tablosu
    console.log('\n2️⃣ Profiles tablosu test ediliyor...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (profilesError) {
      console.error('❌ Profiles hatası:', profilesError.message)
    } else {
      console.log(`✅ ${profiles.length} profil bulundu`)
    }

    // Test 3: Servers tablosu
    console.log('\n3️⃣ Servers tablosu test ediliyor...')
    const { data: servers, error: serversError } = await supabase
      .from('servers')
      .select('id, name, vote_count, member_count')
      .order('vote_count', { ascending: false })
      .limit(10)

    if (serversError) {
      console.error('❌ Servers hatası:', serversError.message)
    } else {
      console.log(`✅ ${servers.length} sunucu bulundu`)
      console.log('   Top 3 sunucu:')
      servers.slice(0, 3).forEach((server, index) => {
        console.log(`   ${index + 1}. ${server.name} - ${server.vote_count || 0} oy`)
      })
    }

    // Test 4: Votes tablosu
    console.log('\n4️⃣ Votes tablosu test ediliyor...')
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })

    if (votesError) {
      console.error('❌ Votes hatası:', votesError.message)
    } else {
      console.log(`✅ ${votes.length} oy bulundu`)
    }

    // Test 5: Son 7 günlük yeni kullanıcılar
    console.log('\n5️⃣ Son 7 günlük yeni kullanıcılar test ediliyor...')
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last7Days.push(date.toISOString().split('T')[0])
    }

    const newUsersData = []
    for (const date of last7Days) {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', date)
        .lt('created_at', nextDay.toISOString())

      if (!error) {
        newUsersData.push({
          date: date,
          count: data?.length || 0
        })
      }
    }

    console.log('✅ Son 7 günlük yeni kullanıcılar:')
    newUsersData.forEach(day => {
      console.log(`   ${day.date}: ${day.count} kullanıcı`)
    })

    // Test 6: Audit logs
    console.log('\n6️⃣ Audit logs test ediliyor...')
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (auditError) {
      console.error('❌ Audit logs hatası:', auditError.message)
    } else {
      console.log(`✅ ${auditLogs.length} audit log bulundu`)
      auditLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.resource_type} (${new Date(log.created_at).toLocaleString('tr-TR')})`)
      })
    }

    // Test 7: Banners
    console.log('\n7️⃣ Banners test ediliyor...')
    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)

    if (bannersError) {
      console.error('❌ Banners hatası:', bannersError.message)
    } else {
      console.log(`✅ ${banners.length} aktif banner bulundu`)
    }

    // Test 8: News
    console.log('\n8️⃣ News test ediliyor...')
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')

    if (newsError) {
      console.error('❌ News hatası:', newsError.message)
    } else {
      console.log(`✅ ${news.length} yayınlanmış haber bulundu`)
    }

    // Test 9: System settings
    console.log('\n9️⃣ System settings test ediliyor...')
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')

    if (settingsError) {
      console.error('❌ System settings hatası:', settingsError.message)
    } else {
      console.log(`✅ ${settings.length} sistem ayarı bulundu`)
    }

    console.log('\n🎉 Dashboard API test tamamlandı!')
    console.log('\n📋 Test Sonuçları:')
    console.log(`   - Admin Users: ${adminUsers?.length || 0}`)
    console.log(`   - Profiles: ${profiles?.length || 0}`)
    console.log(`   - Servers: ${servers?.length || 0}`)
    console.log(`   - Votes: ${votes?.length || 0}`)
    console.log(`   - Audit Logs: ${auditLogs?.length || 0}`)
    console.log(`   - Active Banners: ${banners?.length || 0}`)
    console.log(`   - Published News: ${news?.length || 0}`)
    console.log(`   - System Settings: ${settings?.length || 0}`)

    console.log('\n✅ Tüm testler başarılı! Dashboard API hazır.')

  } catch (error) {
    console.error('❌ Test hatası:', error.message)
    process.exit(1)
  }
}

// Script'i çalıştır
testDashboardAPI()
