<template>
    <div>
        
        <h1>{{ title }}</h1>
        <MarkdownEditor title="Form Description" :text="description" :allowSave="fetchedData" @save="updateDescription"></MarkdownEditor>
        <MarkdownEditor title="Message on Completion" :text="completed.text" :allowSave="fetchedData" @save="updateCompletedText"></MarkdownEditor>
        <v-btn outlined :to="`/submit-test-report/${$route.params.form}`" class="blueBtn">View test form</v-btn>
        <br><br>

        <v-switch v-model="completed.allowDownload" class="ma-2" label="Allow reporter to download PDF?" @change="updateCompleted"></v-switch>

        <v-btn v-if="editJSON.length == 0" outlined v-on:click="openAddSectionModal(0)" class="blueBtn">Add first section</v-btn>
        <v-tabs v-else align-with-title v-model="currentTab">
            <v-tabs-slider color="yellow"></v-tabs-slider>
            <v-tab v-for="tab in tabs" :key="tab.key" @click="changeTab(tab)">
                <template v-if="tab.isSection">
                    {{ tab.title }}
                </template>
                <template v-else>
                    <v-icon>mdi-plus-circle</v-icon>
                </template> 
            </v-tab>
            <v-tabs-items v-model="currentTab">
                <v-tab-item v-for="tab in tabs" :key="tab.key">
                    <template v-if="tab.isSection">
                        <EditQuestionSection v-if="tab.section.type == 'Questions'" :section="tab.section" :web="web" />
                        <EditEmailVerificationSection v-if="tab.section.type == 'Email Verification'" :section="tab.section" :web="web" :title="title" />
                        <EditReporterNumberSection v-if="tab.section.type == 'Reporter Number'" :section="tab.section" :web="web" />
                    </template>
                </v-tab-item>
            </v-tabs-items>
        </v-tabs>
        
        <br /><br />
        <AddSectionModal :show="showAddSectionModal" :newSection="newSection" :web="web" @close="closeAddSectionModal" @submit="addSection" />
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>

<script>
import MarkdownEditor from '../../components/editForm/MarkdownEditor.vue'
import EditQuestionSection from '../../components/editForm/EditQuestionSection.vue';
import EditEmailVerificationSection from '../../components/editForm/EditEmailVerificationSection.vue';
import EditReporterNumberSection from '../../components/editForm/EditReporterNumberSection.vue';

import AddSectionModal from '../../components/editForm/AddSectionModal.vue';

import axios from 'axios';

export default {
    components: {
        EditQuestionSection,
        AddSectionModal,
        EditEmailVerificationSection,
        EditReporterNumberSection,
        MarkdownEditor
    },
    
    data() {
        return {
            title: '',
            description: '',
            completed: {},
            web: false,
            editJSON: [],
            currentTab: null,
            showAddSectionModal: false,
            newSection: {
                title: '',
                type: '',
                default: true,
                allReports: true,
                index: 0
            },
            currentSection: null,
            fetchedData: false
        }
    },

    created() {
        this.fetchData();
        //TODO: Move to async data?
    },

    mounted() {
        
    },

    methods: {
        fetchData() {
            const url = '/api/edit-form/' + this.$route.params.form;
            axios.get(url).then((d) => {
                this.title = d.data.title;
                this.description = d.data.description;
                this.completed = d.data.completed;
                this.web = d.data.web;
                this.editJSON = d.data.sectionLogic;
                this.currentTab = this.editJSON.length > 0 ? 1 : 0;
                this.currentSection = this.currentTab;
                this.fetchedData = true;
            }).catch((err) => {
                //TODO: Implement catches in all axios places (especially fetchData)
            })
        },

        updateDescription(description) {
            console.log('KIT', description, this.fetchedData);
            let url = `/api/edit-form/${this.$route.params.form}/update-description`;
            axios.patch(url, { description: description }).then((response) => {
                //TODO: Handle errors
            });
        },

        updateCompletedText(text) {
            this.completed.text = text;
            this.updateCompleted();
        },

        updateCompleted() {
            console.log('PUP', this.completed, this.fetchedData);
            let url = `/api/edit-form/${this.$route.params.form}/update-completed`;
            axios.patch(url, this.completed).then((response) => {
                //TODO: Handle errors
            });
        },

        openAddSectionModal(index) {
            this.newSection = {
                title: '',
                type: '',
                default: true,
                allReports: true,
                index: index
            }
            this.showAddSectionModal = true;
        },

        closeAddSectionModal() {
            this.currentTab = this.currentSection;
            this.showAddSectionModal = false;
        },

        addSection() {
            let url = `/api/edit-form/${this.$route.params.form}/add-section`;
            axios.post(url, this.newSection).then((response) => {
                let section = response.data.section;
                section.sectionLogic = { default: this.newSection.default };
                section.title = this.newSection.title;
                section.type = this.newSection.type;
                this.editJSON.splice(this.newSection.index, 0, section);
                if (this.editJSON.length == 1) {
                    this.currentTab = 1;
                }
                //TODO: Handle errors
            });
        },

        changeTab(tab) {
            if (!tab.isSection) {
                this.openAddSectionModal(tab.index);
            } else {
                this.currentSection = tab.index;
            }
        }
    },

    computed: {
        tabs: function () {
            let ret = [{
                isSection: false,
                key: 0,
                index: 0
            }];
            for (let i = 0; i < this.editJSON.length; i++) {
                ret.push({
                    isSection: true,
                    key: this.editJSON[i].sectionID,
                    title: this.editJSON[i].title,
                    section: this.editJSON[i]
                });
                ret.push({
                    isSection: false,
                    key: 'addsection' + (i + 1),
                    index: i + 1
                });
            }

            return ret;
        }
    }

}

</script>