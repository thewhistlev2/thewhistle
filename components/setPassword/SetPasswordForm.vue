<template>
    <v-form v-model="valid" lazy-validation>
        <v-text-field v-model="password" label="Password" type="password" :rules="[ validPassword ]" />
        <v-text-field v-model="confirmPassword" label="Confirm Password" type="password" :rules="[ match ]" />

        <v-btn @click="$emit('submit', password)" :disabled="!valid">Set Password</v-btn>
    </v-form>
</template>

<script>
export default {
    data() {
        return {
            valid: false,
            password: '',
            confirmPassword: ''
        }
    },
    methods: {
        validPassword(password) {
            if (password.length < 10) {
                return 'Password must be at least 10 characters';
            } else if (password.length > 32) {
                return 'Password cannot be longer than 32 characters';
            } else if (!/\d/.test(password)) {
                return 'Password must contain at least one number';
            } else if (!/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/.test(password)) {
                return 'Password must contain at least one special character';
            } else if (!/^[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~\w]+$/.test(password)) {
                return 'Password contains invalid characters';
            } else {
                return true;
            }
        },

        match(repeatPassword) {
            if (repeatPassword == this.password) {
                return true;
            } else {
                return 'Passwords do not match'
            }
        }
    }
}
</script>