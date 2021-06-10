<template>
    <div>
        <v-data-table :headers="headers" :items="users" class="elevation-1"></v-data-table>
        <v-btn v-on:click="showCreateModal = true" style="position: absolute; right: 18px; margin-top: 10px; background-color:#033549; color:white;" text>Add User</v-btn>
        <CreateUserModal :show="showCreateModal" @close="closeCreateModal" @submit="createUser" :user="newUser" :orgOptions="adminOrgs" />
    </div>
</template>


<script>
import CreateUserModal from '../components/users/CreateUserModal.vue';
import axios from 'axios'

var _ = require('underscore');

export default {
    components: {
        CreateUserModal
    },
    data() {
        return {
            headers: [{
                text: 'Name',
                value: 'name'
            },
            {
                text: 'Email',
                value: 'email'
            },
            {
                text: 'Organisations',
                value: 'orgString'
            }
            ],
            users: [],
            showCreateModal: false,
            adminOrgs: [],
            newUser: {
                firstName: '',
                surname: '',
                email: '',
                orgs: []
            }
        }
    },
    created() {
        this.fetchData()
    },
    methods: {
        getUser() {
            let user = {};
            try {
                user = this.$cookies.get('user');
            } catch (err) {
                return null;
                //TODO: Redirect to login
            }
            return user;
        },

        canEditUser(currentUserOrgs, orgs) {
            return currentUserOrgs.some(org => orgs.includes(org)); 
        },

        formatUser(user) {
            user.orgString = user.orgs.map((org) => org.name).join(', ');
            user.name = `${user.firstName} ${user.surname}`;
            return user;
        },

        getAdminOrgs(orgs) {
            return orgs.filter((org) => org.role == 'admin')
        },

        fetchData() {
            let currentUser = this.getUser();
            this.adminOrgs = this.getAdminOrgs(currentUser.orgs);
            const url = `/api/users/${currentUser.id}`;
            axios.get(url).then((response) => {
                this.users = response.data.users.map(this.formatUser);
            })
        },

        createUser() {
            let url = `/api/users/create`;
            let data = {
                newUser: this.newUser,
                currentUserID: this.getUser().id
            };
            axios.post(url, data).then((response) => {
                this.users = response.data.users.map(this.formatUser);
                this.newUser =  {
                    firstName: '',
                    surname: '',
                    email: '',
                    password: '',
                    orgs: []
                }
                //TODO: Handle errors
            });
        },

        closeCreateModal() {
            this.showCreateModal = false;
        }
    }

}
</script>
