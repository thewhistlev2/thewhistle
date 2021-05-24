<!-- TODO - default to forms page or organisations (depending on user) -->
<template>
    <v-layout column justify-center align-center>
        <v-flex xs12 sm8 md6>
            <div class="text-xs-center">

            </div>
            <v-card>
                <v-card-title class="headline">
                    Welcome to the Whistle, {{ getUserFirstName() }}
                </v-card-title>
                <v-card-text>
                    <p style="font-style: italic;">Amplifying witness voices, wherever they are, with whatever technology they have at hand.</h3>
                    <p>The Whistle is an academic start-up based at the University of Cambridge. We develop digital
                        tools to connect witnesses of human rights violations to advocacy organizations.</p>
                </v-card-text>
            </v-card>
        </v-flex>
    </v-layout>
</template>

<script>

export default {
    methods: {
        getUserFirstName() {
            let user = this.getUser();
            return user ? user.first_name : ''
        },
        getUser() {
            let user = {};
            try {
                user = user = this.$cookies.get('user');
            } catch (err) {
                return null;
                //TODO: Redirect to login
            }
            return user;
        }
    },
    components: {
    }
}
</script>
