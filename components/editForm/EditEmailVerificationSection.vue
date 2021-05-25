<template>
    <div>
        <br><br>
        <div>
            <v-textarea v-model="$attrs.section.json.prompt" @change="updateSection" label="Prompt for Email Address" outlined />
        </div>
        <div class="email">
            <v-text-field v-model="$attrs.section.json.email.subject" @change="updateSection" label="Subject" outlined />
            <v-textarea v-model="$attrs.section.json.email.text" @change="updateSection" label="Custom Email Text" outlined />
        </div>
        <div v-if="$attrs.section.json.allowedEndings.length == 0">
            Currently accepts any email address.
        </div>
        <div v-for="(ending, index) in $attrs.section.json.allowedEndings" :key="index">
            <v-text-field label="Email Ending" outlined v-model="$attrs.section.json.allowedEndings[index]"
                @change="updateSection" :rules="validText" placeholder="@example.com"></v-text-field>
            <v-btn outlined @click="removeEnding(index)" class="blueBtn">Remove Ending</v-btn>
            <br>
            <br>
        </div>
        <v-btn outlined @click="$attrs.section.json.allowedEndings.push('')" class="blueBtn">Add Allowed Ending</v-btn>
    </div>
</template>
<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>
<script>

import axios from 'axios';

export default {
    
    data() {
        return {
            validText: [ v => !!v || 'Required' ]
        }
    },

    computed: {
    },

    methods: {
        updateSection() {
            let url = `/api/edit-form/${this.$attrs.section.sectionID}/update-section`;
            let data = {
                section: this.$attrs.section.json
            };
            axios.patch(url, data).then((response) => { 
                //TODO: Handle errors
            });
        },

        removeEnding(index) {
            this.$attrs.section.json.allowedEndings.splice(index, 1);
            this.updateSection();
        },
        

    }

}
</script>
