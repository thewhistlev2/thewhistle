<template>
    <div>
        <v-btn :to="testFormURL" class="blueBtn" text>View Test Form</v-btn>
        <v-btn v-if="$attrs.form.published" :to="liveFormURL" class="blueBtn" text>View Live Form</v-btn>
        <v-btn :to="testReportsURL" class="blueBtn" text>View Test Reports</v-btn>
        <v-btn :to="reportsURL" class="blueBtn" text>View Reports</v-btn>
        <template v-if="canEdit">
            <v-btn :to="editURL" class="blueBtn" text>Edit</v-btn>
            <v-btn v-on:click="showPublishModal = true" class="blueBtn" text>Publish</v-btn>
            <v-btn v-on:click="showDeleteModal = true" class="blueBtn" text>Delete</v-btn>
            <FormPublishModal :show="showPublishModal" @publish="publish" @close="closePublishModal" :formSlug="this.$attrs.form.slug" :formTitle="this.$attrs.form.title" />
            <FormDeleteModal :show="showDeleteModal" @close="closeDeleteModal" :formSlug="this.$attrs.form.slug" :formTitle="this.$attrs.form.title" />
        </template>
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

import FormPublishModal from './FormPublishModal.vue';
import FormDeleteModal from './FormDeleteModal.vue';
import axios from 'axios'

export default {
    components: {
        FormPublishModal,
        FormDeleteModal
    },
    data() {
        return {
            showPublishModal: false,
            showDeleteModal: false
        }
    },
    computed: {
        testFormURL: function () {
            return `/submit-test-report/${this.$attrs.form.slug}`;
        },
        liveFormURL: function () {
            return `/submit-report/${this.$attrs.form.slug}`;
        },
        testReportsURL: function () {
            //TODO - NTH - make sure slug is well behaved Parse query params
            //TODO: Make this work
            return `/test-reports/${this.$attrs.form.slug}`;
        },
        reportsURL: function () {
            //TODO - NTH - make sure slug is well behaved Parse query params
            //TODO: Make this work
            return `/reports/${this.$attrs.form.slug}`;
        },
        editURL: function () {
            return `/edit-form/${this.$attrs.form.slug}`;
        },
        canEdit: function () {
            return this.$attrs.form.role == 'admin' || this.$attrs.form.role == 'editor';
        }
    },
    methods: {
        closePublishModal() {
            this.showPublishModal = false;
        },

        closeDeleteModal() {
            this.showDeleteModal = false;
        },

        publish() {
            let url = `/api/edit-form/${this.$attrs.form.slug}/publish`;
            axios.post(url).then((response) => {
                this.$attrs.form.published = true;
            });
        }
    }
}
</script>
