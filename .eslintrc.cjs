module.exports = {
    env: {
        browser: true,
        node: true
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
    rules: {
        'vue/require-default-prop': 'off',
        'vue/multi-word-component-names': 'off',
        'no-unused-vars': 'off',
        'vue/v-on-event-hyphenation': 'off',
        'vue/component-definition-name-casing': 'off',
        'vue/no-dupe-keys': 'off',
        'vue/attributes-order': 'off'
    },
    globals: {
        _: true,
    }
}
