<template>
    <div>
        <p v-if="error" class="error">
            {{ error }}
        </p>
        <LoginForm v-if="!passwordAuthenticated" :login="login" />
        <LoginVerification v-else :requireResend="requireResend" :authenticate="authenticateVerificationCode" @resend="resendEmailVerification" />
    </div>
</template>
<style scoped>
.error {
    color: darkred;
}
</style>
<script>

import LoginForm from '../components/login/LoginForm.vue';
import LoginVerification from '../components/login/LoginVerification.vue';
import axios from 'axios';

export default {
    components: {
        LoginForm,
        LoginVerification
    },

    data() {
        return {
            passwordAuthenticated: false,
            error: null,
            requireResend: false,
            loginDetails: {
                email: '',
                password: ''
            }
        }
    },

    methods: {
        login(loginInfo) {
            axios.post('/api/auth/login', loginInfo).then((response) => {
                this.passwordAuthenticated = true;
                this.loginDetails = loginInfo;
                this.error = null;
            }).catch((err) => {
                if (err.response.status == 401) {
                    this.error = 'Incorrect login credentials. Please try again.';
                } else {
                    this.error = 'Something went wrong';
                }
            });
        },

        authenticateVerificationCode(verificationCode) {
            let url = `/api/auth/verification-code`;
            let body = {
                email: this.loginDetails.email,
                password: this.loginDetails.password,
                verificationCode: verificationCode
            };
            
            axios.post(url, body).then((response) => {
                this.$nuxt.$emit('login');
                this.$router.push('/');
                this.error = null;
            }).catch((err) => {
                if (err.response.status == 401) {
                    if (err.response.data == 'Too many attempts') {
                        this.error = 'You have sent entered an incorrect verification code too many times.';
                        this.requireResend = true;
                    } else {
                        this.error = 'Incorrect verification code. Please try again.';
                    }  
                } else {
                    this.error = 'Could not authenticate you. Please try again.';
                }
            });
        },

        resendEmailVerification() {
            let url = `/api/auth/resend-code`;
            axios.post(url, this.loginDetails).then((response) => {
                this.error = null;
                this.requireResend = false;
            }).catch((err) => {
                if (err.status == 401) {
                    this.error = 'Unauthenticated. Could not send verification code.'
                } else {
                    this.error = 'Could not send verification code.';
                }
            });
        }
    }

}
</script>
