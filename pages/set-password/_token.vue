<template>
    <div>
        <div v-if="passwordSet">
            <p>Password successfully set.</p>
            <v-btn to="/login" class="blueBtn" text>Go To Login Page</v-btn>
        </div>
        <div v-else>
            <div v-if="validToken">
                <h1>Set Password</h1>
                <SetPasswordForm @submit="setPassword"></SetPasswordForm>
            </div>
            <div v-else>
                Invalid link.
            </div>
        </div>
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>
<script>
import axios from 'axios';
import SetPasswordForm from '../../components/setPassword/SetPasswordForm.vue';
export default {
    components: {
        SetPasswordForm
    },

    data() {
        return {
            passwordSet: false
        }
    },

    asyncData(context) {
        return {
            validToken: context.validToken
        }
    },

    methods: {
        setPassword(password) {
            let url = `/api/auth/set-password`;
            let data = {
                password: password,
                token: this.$route.params.token
            };
            axios.patch(url, data).then((response) => {
                this.passwordSet = true;
            });
        }
    }

}
</script>
