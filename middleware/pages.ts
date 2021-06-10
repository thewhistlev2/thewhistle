class Pages {

    /* static async loadEditForm(formSlug) {
        try {
            const url = process.env.baseURL + '/api/edit-form/' + formSlug;
            const form = await axios.get(url);
            return form.data;
        } catch (err) {
            //TODO: Handle error properly
        }
    } */

    static async loadReports(form, test, $axios) {
        const url = `api/reports/${form}${test ? '/test' : ''}`;
        const reports = await $axios.get(url);
        return reports.data;
    }


/*     static async loadForms(user) {
        const userId = 1; // user.id
        const url = process.env.baseURL + '/api/forms/user/' + userId;
        const form = await axios.get(url);
        return form.data;
    }


    static async loadUsers(orgId) {
      const url = process.env.baseURL + '/api/users/organisation/'+ orgId +'/users';
      const form = await axios.get(url);
      return form.data;
    } */

    static async loadFormFromSlug(slug, test, $axios) {
        try {
            const url = `api/forms/${slug}${test ? '/test' : ''}`;
            const form = await $axios.get(url);
            return form.data;
        } catch (err) {
            console.error('Error loading form from slug', err);
        }
    }

    static async validatePasswordToken(token, $axios) {
        try {
            const url = `api/auth/validate-password-token/${token}`;
            const response = await $axios.get(url);
            return response.data;
        } catch (err) {
            console.log(err)
            console.error('Error validating token')
        }
    }

    static async loadErrors($axios) {
        const url = 'api/errors';
        const errors = await $axios.get(url);
        return errors.data;
    }


    // static async loadReport(reportId) {
    //     const url = process.env.baseURL + `/api/report/${reportId}`;
    //     const report = await axios.get(url);
    //     return report.data;
    // }


    static async loadFormViewAccess(userId, formId) {
        return '';
    }


    static async loadEditUser(userId) {
        return '';
    }


    static async loadCreateUser() {
        return '';
    }
}

export default Pages;
