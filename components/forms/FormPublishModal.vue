<template>
    <v-row justify="center">
        <v-dialog v-model="$attrs.show" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">Publish Form</span>
                </v-card-title>
                <v-card-text>
                    Are you sure you want to publish form '{{ $attrs.formTitle }}'?
                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="blue darken-1" text v-on:click="closeModal">Close</v-btn>
                    <v-btn color="blue darken-1" text @click="publishForm">Publish</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>
<script>
export default {
    methods: {
        publishForm() {
            this.$emit('publish');
            this.closeModal();
        },

        closeModal() {
            this.$attrs.show = false;
            this.$emit('close');
        }
    }
}
</script>
