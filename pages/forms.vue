<template>
    <div>
        <v-btn v-on:click="showCreateFormModal = true" class="blueBtn" text>Create New Form</v-btn>
        <v-card v-for="form in forms" :key="form.slug" style="margin-bottom: 30px;">
            <v-card-title class="align-end fill-height">{{ form.organisation }} - {{ form.title }}</v-card-title>
            <v-card-actions>
                <FormActions :form="form" />
            </v-card-actions>
        </v-card>
        <CreateFormModal :show="showCreateFormModal" :newForm="newForm" :allForms="forms" @close="closeCreateFormModal" @submit="createForm" />
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
    margin-bottom: 10px;
}
</style>
<script>

import FormActions from '../components/forms/FormActions.vue';
import CreateFormModal from '../components/forms/CreateFormModal.vue'
import axios from 'axios'

export default {
    components: {
        CreateFormModal,
        FormActions
    },
    data() {
        return {
            showCreateFormModal: false,
            newForm: {
                org: '',
                title: '',
                slug: '',
                description: '',
                web: true
            },
            forms: []
        }
    },
    created() {
        this.fetchData();
        //TODO: Move to async data?
    },
    methods: {
        fetchData() {
            if (this.user) {
                const url = '/api/forms/user/' + this.user.id;
                axios.get(url).then((d) => {
                    this.forms = d.data.forms
                })
            } else {
                //TODO: Redirect to login
            }
        },

        closeCreateFormModal() {
            this.showCreateFormModal = false;
        },

        createForm() {
            //TODO: Loading icon on wait
            //TODO: Create form and router.push to new form url on success
            let url = `/api/edit-form/${this.newForm.slug}/create`;
            let data = {
                org: this.newForm.org,
                title: this.newForm.title,
                description: this.newForm.description,
                web: this.newForm.web
            };
            axios.post(url, data).then((response) => {
                this.$router.push(`/edit-form/${this.newForm.slug}`)
                //TODO: Handle errors
            });
        }

    },

    computed: {
        user: function () {
            let user = {};
            try {
                user = user = this.$cookies.get('user');
            } catch (err) {
                return null;
                //TODO: Redirect to login
            }
            return user;
        }
    }
}
</script>
