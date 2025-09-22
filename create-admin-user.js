// Güvenli admin kullanıcısı oluşturma script'i
// Bu script'i Node.js ile çalıştırın: node create-admin-user.js

const argon2 = require('argon2')
const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ve Service Role Key gerekli!')
  console.error('Environment variables:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminUser() {
  try {
    console.log('🔐 Güvenli admin kullanıcısı oluşturuluyor...')
    
    // Admin bilgileri
    const adminData = {
      username: 'admin',
      email: 'admin@votesitem.com',
      password: 'Admin123!', // Güçlü şifre
      role: 'super_admin',
      permissions: ['all']
    }

    // Şifreyi Argon2 ile hash'le
    console.log('🔒 Şifre hash\'leniyor...')
    const passwordHash = await argon2.hash(adminData.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    })

    // Admin kullanıcısını oluştur
    console.log('👤 Admin kullanıcısı oluşturuluyor...')
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: adminData.username,
        email: adminData.email,
        password_hash: passwordHash,
        role: adminData.role,
        permissions: adminData.permissions,
        is_active: true,
        is_locked: false,
        failed_attempts: 0,
        twofa_enabled: false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  Admin kullanıcısı zaten mevcut!')
        
        // Mevcut kullanıcıyı güncelle
        const { data: updatedUser, error: updateError } = await supabase
          .from('admin_users')
          .update({
            password_hash: passwordHash,
            role: adminData.role,
            permissions: adminData.permissions,
            is_active: true,
            is_locked: false,
            failed_attempts: 0,
            updated_at: new Date().toISOString()
          })
          .eq('username', adminData.username)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Kullanıcı güncellenemedi:', updateError.message)
          process.exit(1)
        }

        console.log('✅ Admin kullanıcısı güncellendi!')
        console.log('📋 Kullanıcı bilgileri:')
        console.log(`   Username: ${updatedUser.username}`)
        console.log(`   Email: ${updatedUser.email}`)
        console.log(`   Role: ${updatedUser.role}`)
        console.log(`   Permissions: ${JSON.stringify(updatedUser.permissions)}`)
        console.log(`   Active: ${updatedUser.is_active}`)
        console.log(`   Locked: ${updatedUser.is_locked}`)
      } else {
        console.error('❌ Admin kullanıcısı oluşturulamadı:', error.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!')
      console.log('📋 Kullanıcı bilgileri:')
      console.log(`   Username: ${data.username}`)
      console.log(`   Email: ${data.email}`)
      console.log(`   Role: ${data.role}`)
      console.log(`   Permissions: ${JSON.stringify(data.permissions)}`)
      console.log(`   Active: ${data.is_active}`)
      console.log(`   Locked: ${data.is_locked}`)
    }

    // Test banner oluştur
    console.log('🎯 Test banner oluşturuluyor...')
    const { data: banner, error: bannerError } = await supabase
      .from('banners')
      .insert({
        title: 'Test Banner',
        description: 'Bu bir test bannerıdır',
        image_url: 'https://via.placeholder.com/728x90/7c3aed/ffffff?text=Test+Banner',
        target_url: 'https://example.com',
        position: 'top',
        size: '728x90',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
        is_active: true,
        max_impressions: 10000,
        cost_per_impression: 0.01,
        total_budget: 100.00,
        created_by: data?.id || (await supabase.from('admin_users').select('id').eq('username', 'admin').single()).data?.id
      })
      .select()
      .single()

    if (bannerError) {
      console.log('⚠️  Test banner oluşturulamadı:', bannerError.message)
    } else {
      console.log('✅ Test banner oluşturuldu!')
    }

    // Test haber oluştur
    console.log('📰 Test haber oluşturuluyor...')
    const { data: news, error: newsError } = await supabase
      .from('news')
      .insert({
        title: 'Hoş Geldiniz!',
        content: '<h1>MineVote Admin Paneline Hoş Geldiniz!</h1><p>Bu admin paneli ile sitenizi yönetebilirsiniz.</p>',
        excerpt: 'Admin paneline hoş geldiniz mesajı',
        status: 'published',
        published_at: new Date().toISOString(),
        author_id: data?.id || (await supabase.from('admin_users').select('id').eq('username', 'admin').single()).data?.id
      })
      .select()
      .single()

    if (newsError) {
      console.log('⚠️  Test haber oluşturulamadı:', newsError.message)
    } else {
      console.log('✅ Test haber oluşturuldu!')
    }

    // Sosyal medya hesapları ekle
    console.log('📱 Sosyal medya hesapları ekleniyor...')
    const socialAccounts = [
      { platform: 'discord', username: 'minevote', url: 'https://discord.gg/minevote' },
      { platform: 'twitter', username: 'minevote', url: 'https://twitter.com/minevote' },
      { platform: 'youtube', username: 'minevote', url: 'https://youtube.com/@minevote' }
    ]

    for (const account of socialAccounts) {
      const { error: socialError } = await supabase
        .from('social_accounts')
        .insert({
          ...account,
          is_active: true
        })

      if (socialError) {
        console.log(`⚠️  ${account.platform} hesabı eklenemedi:`, socialError.message)
      } else {
        console.log(`✅ ${account.platform} hesabı eklendi!`)
      }
    }

    console.log('\n🎉 Admin paneli kurulumu tamamlandı!')
    console.log('\n📋 Giriş bilgileri:')
    console.log(`   URL: https://your-site.netlify.app/admin`)
    console.log(`   Username: ${adminData.username}`)
    console.log(`   Password: ${adminData.password}`)
    console.log('\n⚠️  Güvenlik uyarısı:')
    console.log('   - İlk girişten sonra şifrenizi değiştirin')
    console.log('   - 2FA\'yı etkinleştirin')
    console.log('   - Güçlü şifreler kullanın')
    console.log('   - Düzenli olarak audit logları kontrol edin')

  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

// Script'i çalıştır
createAdminUser()
