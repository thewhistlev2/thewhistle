<template>
    <div>
        <div v-if="!startedReport">
            <VueMarkdown :anchorAttributes="{target:'_blank'}">{{$attrs.form.description}}</VueMarkdown>
            <br>
            <v-btn outlined v-on:click="startReport" class="blueBtn">Start Report</v-btn>
        </div>
        <div v-else>
            <Questions :key="questionsKey" v-if="currentSection.type == 'Questions'" :section="currentSection" :sessionID="sessionID" :test="$attrs.test" @complete="showNextSection"></Questions>
            <EmailVerification v-if="currentSection.type == 'Email Verification'" :section="currentSection" :sessionID="sessionID" :test="$attrs.test" @complete="showNextSection"></EmailVerification>
            <ReporterNumber v-if="currentSection.type == 'Reporter Number'" :section="currentSection" :sessionID="sessionID" :test="$attrs.test" @complete="showNextSection"></ReporterNumber>
            <Completed v-if="currentSection.type == 'Completed'" :section="currentSection" :sessionID="sessionID"></Completed>
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

//TODO: Sort broken refresh

//import Typeform from './Typeform.vue'
import ReporterNumber from './sections/ReporterNumber.vue';
import EmailVerification from './sections/EmailVerification.vue';
import Questions from './sections/Questions.vue';
import Completed from './sections/Completed.vue';
//TODO: Do imports
import axios from 'axios';
import VueMarkdown from 'vue-markdown';

export default {
    components: {
        Questions,
        Completed,
        ReporterNumber,
        EmailVerification,
        VueMarkdown
    },

    data() {
        return {
            startedReport: false,
            sessionID: '',
            currentSection: {},
            questionsKey: 0
        }
    },

    methods: {
        startReport() {
            //TODO: Get form
            let url = `/api/report/start/${this.$attrs.form.id}`;

            let data = {
                test: this.$attrs.test                                                                   
            };

            axios.post(url, data)
                .then((response) => {
                    this.sessionID = response.data.sessionID; //TODO: Make this session ID instead of report ID
                    this.startedReport = true;
                    if (response.data.nextSection.type == 'Questions') {
                        this.currentSection = response.data.nextSection;
                    } else {
                        this.currentSection = response.data.nextSection.json;
                        this.currentSection.id = response.data.nextSection.id;
                        this.currentSection.type = response.data.nextSection.type;
                    }
                })
                .catch((response) => {
                    //TODO: Check response
                });
        },

        showNextSection(section) {
            this.questionsKey++; //Incrementing key rerenders component (necessary for multiple Typeform sections)
            this.currentSection = section.json;
            this.currentSection.id = section.id;
            this.currentSection.type = section.type;
        }
    }

}
</script>
