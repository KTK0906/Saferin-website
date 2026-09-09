<script setup lang="ts">
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient' // Make sure this path points to your initialized Supabase client

import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const form = ref({
  loginInput: '', // Accepts either username or email
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Validation rule: accepts valid email OR 3–30 character username
const loginInputValidator = (value: string) => {
  if (!value) return 'Please enter your Email or Username'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/

  if (emailRegex.test(value) || usernameRegex.test(value)) {
    return true
  }

  return 'Must be a valid email or username (3-30 characters)'
}

async function handleLogin() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    let emailToAuth = form.value.loginInput.trim()

    // If the input doesn't look like an email, look up the email via the username in public.profiles
    if (!emailToAuth.includes('@')) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', emailToAuth)
        .single()

      if (profileError || !profile) {
        throw new Error('Invalid username or password.')
      }

      // Fetch the email tied to this profile's user ID
      const { data: userData, error: userError } = await supabase
        .rpc('get_email_by_id', { user_id: profile.id })

      if (userError || !userData) {
        throw new Error('Unable to retrieve account email.')
      }

      emailToAuth = userData.email
    }

    // Authenticate with Supabase Auth using Email + Password
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToAuth,
      password: form.value.password,
    })

    if (authError) throw authError

    // Navigate to the dashboard on successful login
    router.push('/dashboard')
  } catch (err: any) {
    errorMessage.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Welcome to <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <!-- Display error message if authentication fails -->
          <VAlert
            v-if="errorMessage"
            type="error"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>

          <!-- Bind submit event to handleLogin -->
          <VForm @submit.prevent="handleLogin">
            <VRow>
              <!-- email or username -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.loginInput"
                  autofocus
                  label="Email or Username"
                  placeholder="johndoe@email.com or username"
                  :rules="[loginInputValidator]"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <!-- remember me checkbox -->
                <div class="d-flex align-center justify-space-between flex-wrap my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                  />

                  <RouterLink
                    class="text-primary"
                    :to="{ name: 'pages-authentication-forgot-password-v1' }"
                  >
                    Forgot Password?
                  </RouterLink>
                </div>

                <!-- login button -->
                <VBtn
                  block
                  type="submit"
                  :loading="isLoading"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block">
                  New on our platform?
                </span>
                <RouterLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  :to="{ name: 'pages-authentication-register-v1' }"
                >
                  Create an account
                </RouterLink>
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4 text-high-emphasis">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>