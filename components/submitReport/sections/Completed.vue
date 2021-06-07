<template>
    <div>
        <VueMarkdown :anchorAttributes="{target:'_blank'}">{{$attrs.section.text}}</VueMarkdown>
        <v-btn v-if="$attrs.section.allowDownload" outlined @click="downloadPDF" class="blueBtn">Download Report PDF</v-btn>
    </div>
</template>

<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>

<script>
import VueMarkdown from 'vue-markdown';


export default {
    components: {
        VueMarkdown
    },
    methods: {
        downloadPDF() {
            let url = `/api/session/download-pdf`;
            window.open(url);
        },
    }
}
</script>
