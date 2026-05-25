<template>
  <div class="page">
    <div class="brand-panel">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="brand-logo">Fit<span>Gym</span> Planner</div>
      <div class="brand-content">
        <h2 class="brand-tagline">Join the<br><em>community.</em></h2>
        <p class="brand-desc">Book classes, track your membership and manage your fitness journey — all in one place.</p>
      </div>
      <div class="brand-stats">
        <div class="stat-item"><div class="stat-number">150+</div><div class="stat-label">Sessions / month</div></div>
        <div class="stat-item"><div class="stat-number">3</div><div class="stat-label">Roles managed</div></div>
        <div class="stat-item"><div class="stat-number">24/7</div><div class="stat-label">Accessible</div></div>
      </div>
    </div>

    <div class="form-panel">
      <div class="form-container">
        <div class="form-header">
          <h1>Create an account</h1>
          <p>Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
        </div>

        <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

        <form @submit.prevent="handleSubmit">
          <div class="row">
            <div class="field">
              <label for="firstName">First name</label>
              <input id="firstName" v-model="firstName" type="text" placeholder="John" required @input="errorMsg = ''" />
            </div>
            <div class="field">
              <label for="lastName">Last name</label>
              <input id="lastName" v-model="lastName" type="text" placeholder="Doe" required @input="errorMsg = ''" />
            </div>
          </div>

          <div class="field">
            <label for="email">Email address</label>
            <input id="email" v-model="email" type="email" placeholder="you@example.com" required @input="errorMsg = ''" />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 6 characters"
                required
                @input="errorMsg = ''"
              />
              <button type="button" class="toggle-pwd" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide' : 'Show'">
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="!loading">Create account</span>
            <span v-else class="spinner"></span>
          </button>
        </form>

        <div class="form-footer">
          <p>FitGym Planner &copy; 2026 — ISEP Porto Project</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiRegister, apiLogin } from '@/api/auth'

const router = useRouter()
const auth = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  errorMsg.value = ''
  if (password.value.length < 6) {
    errorMsg.value = 'Password must be at least 6 characters.'
    return
  }
  loading.value = true
  try {
    await apiRegister(firstName.value, lastName.value, email.value, password.value)
    const { token, user } = await apiLogin(email.value, password.value)
    auth.login(token, user)
    router.push('/member/dashboard')
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { display: flex; height: 100vh; overflow: hidden; }

.brand-panel {
  flex: 0 0 45%;
  background: var(--primary);
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 48px; position: relative; overflow: hidden;
}
.brand-panel::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 80%, rgba(16,185,129,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 60%);
}
.shape { position: absolute; border-radius: 50%; opacity: 0.04; background: #fff; }
.shape-1 { width: 300px; height: 300px; top: -80px; right: -60px; }
.shape-2 { width: 200px; height: 200px; bottom: 10%; left: -40px; }
.brand-logo { position: relative; z-index: 1; font-family: var(--font-display); font-weight: 800; font-size: 28px; color: #fff; }
.brand-logo span { color: var(--accent); }
.brand-content { position: relative; z-index: 1; max-width: 400px; }
.brand-tagline { font-family: var(--font-display); font-weight: 700; font-size: clamp(32px,3.5vw,48px); line-height: 1.15; color: #fff; margin-bottom: 20px; letter-spacing: -1px; }
.brand-tagline em { font-style: normal; background: linear-gradient(135deg,var(--accent),#34D399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.brand-desc { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.55); }
.brand-stats { position: relative; z-index: 1; display: flex; gap: 40px; }
.stat-number { font-family: var(--font-display); font-weight: 700; font-size: 32px; color: var(--accent); }
.stat-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }

.form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; }
.form-container { width: 100%; max-width: 420px; }
.form-header { margin-bottom: 32px; }
.form-header h1 { font-family: var(--font-display); font-weight: 700; font-size: 28px; margin-bottom: 8px; letter-spacing: -0.5px; }
.form-header p { font-size: 15px; color: var(--text-muted); }

.error-box { padding: 12px 16px; border-radius: 10px; background: var(--error-bg); border: 1px solid rgba(239,68,68,0.15); margin-bottom: 20px; color: var(--error); font-size: 14px; font-weight: 500; }

.row { display: flex; gap: 16px; }
.row .field { flex: 1; }
.field { margin-bottom: 20px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; letter-spacing: 0.3px; text-transform: uppercase; }
.input-wrapper { position: relative; }
.field input { width: 100%; padding: 14px; font-family: var(--font-body); font-size: 15px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface-alt); color: var(--text); outline: none; transition: all 0.2s; }
.field input::placeholder { color: var(--text-light); }
.field input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-glow); }
.toggle-pwd { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-light); padding: 4px; display: flex; align-items: center; transition: color 0.2s; }
.toggle-pwd:hover { color: var(--text); }
.toggle-pwd svg { width: 18px; height: 18px; }

.btn-submit { width: 100%; padding: 15px; font-family: var(--font-display); font-size: 16px; font-weight: 600; color: #fff; background: var(--accent); border: none; border-radius: 10px; cursor: pointer; transition: all 0.25s; margin-top: 8px; }
.btn-submit:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.25); }
.btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
.spinner { display: inline-block; width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.form-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); text-align: center; }
.form-footer p { font-size: 13px; color: var(--text-light); }

@media (max-width: 900px) {
  .brand-panel { display: none; }
  .form-panel { padding: 32px 24px; }
}
</style>
