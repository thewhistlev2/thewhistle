<template>
    <div>
        <p style="text-align: left;">You can skip questions or go back to previous questions using the up/down arrows (bottom right corner).</p>
        <p style="text-align: left;">We won't be able to see any of your responses until you press the submit button at the end. After this, you will be able to download a PDF of your responses.</p>
        <div style="margin: 0 auto; width: 600px;">
            <!-- TODO - ensure height works -->
            <div style="width: 100%; height: 500px;" id="embedded-typeform"></div>
        </div>
    </div>
</template>

<style scoped>
.blueBtn {
    background-color: #50addb;
    color: white;
}
</style>

<script>
import * as typeformEmbed from '@typeform/embed';
import axios from 'axios';

export default {

    mounted() {
        this.displayTypeform();
    },

    methods: {
        displayTypeform() {
            const url = `${this.$attrs.section._links.display}?session=${this.$attrs.sessionID}`;
            var el = document.getElementById('embedded-typeform');
            //TODO: Make this run on start report event
            // When instantiating a widget embed, you must provide the DOM element
            // that will contain your typeform, the URL of your typeform, and your
            // desired embed settings
            // TODO: add callback for submit button
            typeformEmbed.makeWidget(el, url, {
                hideFooter: false,
                hideHeaders: true,
                opacity: 0,
                onSubmit: this.onSectionComplete
            });
            this.currentDiv++;
        },

        onSectionComplete(event) {
            let url = `/api/report/next-section/${this.$attrs.sessionID}${this.$attrs.test ? '/test' : ''}`;
            axios.get(url)
                .then((response) => {
                    let section = response.data;
                    this.$emit('complete', section);
                })
                .catch((response) => {
                    console.error(response);
                    //TODO: Check response
                })
            
        }
    }
}
</script>
