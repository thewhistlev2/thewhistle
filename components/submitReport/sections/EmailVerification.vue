<template>
    <div>
        <p>{{$attrs.section.prompt}}</p>
        <v-form v-model="validEmail" @submit.prevent>
            <v-text-field v-model="email" label="Email" :rules="emailRules" outlined></v-text-field>
        </v-form>
        <v-btn outlined :disabled="!validEmail" @click="sendVerification" class="blueBtn">{{ emailSent ? 'Resend' : 'Send' }} Verification Code</v-btn>
        <br><br>
        <div v-if="emailSent">
            <v-form v-model="validCode" @submit.prevent>
                <v-text-field v-model="verificationCode" @change="incorrectVerificationCode = false" :rules="verificationCodeRules" outlined></v-text-field>
                <p v-if="incorrectVerificationCode" class="err">
                    Incorrect Verification Code. Please Try Again.
                </p>
            </v-form>
            <v-btn outlined :disabled="!validCode" @click="verifyCode" class="blueBtn">Verify Code</v-btn>
        </div>
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
.err {
    color: red;
}
</style>
<script>
import axios from 'axios';

export default {

    data() {
        return {
            email: '',
            verificationCode: '',
            emailSent: false,
            validEmail: false,
            validCode: false,
            incorrectVerificationCode: false,
            emailRules: [(v) => this.isValidEmail(v) || 'Invalid email address', (v) => this.validEnding(v) || !this.$attrs.section.json.allowedEndings || ('Email ending must match ' + this.$attrs.section.json.allowedEndings.join(', ')) ],
            verificationCodeRules: [(v) => v.length == 6 || 'Must be 6 characters long', (v) => this.isAlphanumeric(this.verificationCode) || 'Must only contain letters and numbers']
        }
    },

    computed: {
        
    },

    methods: {
        validEnding(email) {
            if (this.$attrs.section.json) {
                console.log(this.$attrs.section.prompt);
                if (this.$attrs.section.json.allowedEndings) {
                    if (this.$attrs.section.json.allowedEndings.length == 0) {
                        return true;
                    } else {
                        for (let i = 0; i < this.$attrs.section.json.allowedEndings.length; i++) {
                            if (email.endsWith(this.$attrs.section.json.allowedEndings[i])) {
                                return true;
                            }
                        }
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return true;
            }
        },

        isValidEmail(email) {
            const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return emailRegex.test(email);
        },

        isAlphanumeric(value) {
            const regex = /^[a-z0-9]+$/i;
            return regex.test(value);
        },

        sendVerification() {
            let url = `/api/report/send-email-verification/${this.$attrs.sessionID}`;
            
            let data = {
                email: this.email,
                test: this.$attrs.test,
                sectionID: this.$attrs.section.id
            };

            axios.post(url, data)
                .then(() => {
                    this.emailSent = true;
                })
                .catch(() => {
                    //TODO: Handle other errors
                })
        },

        verifyCode() {
            let url = `/api/report/submit-section/${this.$attrs.sessionID}`;
            
            let data = {
                type: 'email-verification',
                test: this.$attrs.test,
                verificationCode: this.verificationCode
            };

            axios.post(url, data)
                .then((response) => {
                    this.$emit('complete', response.data);
                })
                .catch((err) => {
                    if (err.response) {
                        if (err.response.status == '401') {
                            this.incorrectVerificationCode = true;
                        }
                        //TODO: Handle other errors
                    }
                })
        }
    }
}
</script>
