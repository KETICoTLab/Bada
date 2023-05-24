export default {
  name: 'User',
  data() {
    return {
      users: {},
      fields: [
        { key: 'email', label: 'E-Mail', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'department', label: 'Department', sortable: true },
      ],
      items: [],
      sortBy: "email",
      sortDesc: true,
    }
  },
  methods: {
    list() {
      this.$http.get('/user/list')
      .then((result) => {
        this.items = result.data;
      })
    }
  },
  created() {
    this.list();
  }
}