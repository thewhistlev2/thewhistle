<template>
    <v-row justify="center">
        <v-dialog v-model="$attrs.show" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">Add User</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-form ref="form" v-model="valid">
                                <v-col cols="12">
                                    <v-text-field v-model="$attrs.user.firstName" :rules="validName" label="First name" required></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field v-model="$attrs.user.surname" :rules="validName" label="Surname" required></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field v-model="$attrs.user.email" :rules="validEmail" label="Email" required></v-text-field>
                                </v-col>
                                <v-col cols="12">
                                    <v-select v-model="$attrs.user.orgs" :items="$attrs.orgOptions" item-text="name" return-object chips label="Organisations" multiple></v-select>
                                </v-col>
                                <v-col v-for="org in $attrs.user.orgs" :key="org.id" cols="12">
                                    <v-select v-model="org.role" :rules="notBlank" :items="['admin', 'editor']" :label="org.name + ' role'" required></v-select>
                                </v-col>
                            </v-form>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="blue darken-1" text v-on:click="closeModal">Close</v-btn>
                    <v-btn color="blue darken-1" text @click="createUser">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>
<script>
export default {
    data() {
        return {
            notBlank: [v => !!v || 'Required'],
            validName: [v => !!v || 'Required', v => (new RegExp(/^[a-zA-Z' -]+$/g)).test(v) || 'Can only contain letters, apostrophes, hyphens and spaces'],
            validEmail: [v => !!v || 'Required', v => (new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/g)).test(v) || 'Invalid email address'],
            validPassword: [v => !!v || 'Required',  v => (new RegExp(/^\S+$/g)).test(v) || 'Invalid password', v => v.length > 7 && v.length < 21 || 'Password must be between 8 and 20 characters.'],
            valid: false
        }
    },
    methods: {
        createUser() {
            this.$emit('submit');
            this.closeModal();
        },

        closeModal() {
            this.$attrs.show = false;
            this.$emit('close');
        }
    }
}
</script>
