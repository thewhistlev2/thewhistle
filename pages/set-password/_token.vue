<template>
    <div>
        
        <div v-if="validToken">
            <h1>Set Password</h1>
            <SetPasswordForm @submit="setPassword"></SetPasswordForm>
        </div>
        <div v-else>
            Invalid link.
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import SetPasswordForm from '../../components/setPassword/SetPasswordForm.vue';
export default {
    components: {
        SetPasswordForm
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
                this.$router.push('login');
            });
        }
    }

}
</script>
