<template>
    <div>
        <template v-if="$attrs.section.questions.length == 0">
            <v-btn outlined v-on:click="openAddQuestionModal" class="blueBtn">Add first question</v-btn>
            <AddQuestionModal :show="showAddQuestionModal" :web="$attrs.web" @close="closeAddQuestionModal" @submit="addQuestion" :newQuestion="newQuestion" :allRefs="allRefs" />
        </template>
        <EditQuestion v-for="question in $attrs.section.questions" :sectionID="$attrs.section.sectionID" :question="question" :web="$attrs.web" :key="question.ref" v-on:questionChange="updateSectionQuestions" :allRefs="allRefs" />
        <br><br>
        <v-textarea v-model="$attrs.section.completedText" @change="updateCompletedText" label="Section Completed Text" outlined />
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>
<script>

import EditQuestion from './EditQuestion.vue'
import AddQuestionModal from './AddQuestionModal.vue';

import axios from 'axios';

export default {
    components: {
        EditQuestion,
        AddQuestionModal
    },
    
    data() {
        return {
            showAddQuestionModal: false,
            newQuestion: {
                type: '',
                ref: '',
                title: '',
                optionRef: '',
            }
        }
    },

    computed: {
        allRefs: function () {
            return this.$attrs.section.questions.map(q => q.ref);
        }
    },

    methods: {
        addQuestion() {
            let url = `/api/edit-form/${this.$attrs.section.sectionID}/add-first-question`;
            let data = {
                question: this.newQuestion
            };
            axios.post(url, data).then((response) => {
                this.updateSectionQuestions(response.data.section);  
                //TODO: Handle errors
            });
        },

        updateCompletedText() {
            let url = `/api/edit-form/${this.$attrs.section.sectionID}/update-completed-text`;
            let data = {
                completedText: this.$attrs.section.completedText
            };
            axios.patch(url, data).then((response) => {
                //TODO: Handle errors
            });
        },

        updateSectionQuestions(questions) {
            this.$attrs.section.questions = questions;
        },

        openAddQuestionModal() {
            this.showAddQuestionModal = true;
        },

        closeAddQuestionModal() {
            this.showAddQuestionModal = false;
        }
    }

}
</script>
