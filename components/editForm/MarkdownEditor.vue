            
<template>
    <div>
        <h3>{{$attrs.title}}</h3>
        <v-md-editor v-model="$attrs.text" @change="save" @save="save" left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image" right-toolbar="preview save"></v-md-editor>
        <br />
    </div>
</template>
<script>
export default {
    methods: {
        save(text) {
            this.$emit('save', text);
        }
    }
}
</script>