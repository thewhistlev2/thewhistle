            
<template>
    <div>
        <h3>{{$attrs.title}}</h3>
        <client-only>
            <v-md-editor v-model="$attrs.text" @change="save" @save="save" left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image" right-toolbar="preview save"></v-md-editor>
        </client-only>
        <br />
    </div>
</template>
<script>
export default {
    methods: {
        save(text) {
            if (text.length > 0 && this.$attrs.allowSave) {
                this.$emit('save', text);
            }
        }
    }
}
</script>