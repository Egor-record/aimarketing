<template>
    <div class="container">
        <h1>Админ панель</h1>
        <div class="table-responsive mt-5">
            <AdminTable></AdminTable>
        </div>
    </div>
</template>
<script>
  import AdminTable from '@/components/AdminTable.vue';
  export default {
    name: 'TablePage',
    components: {
        AdminTable
    },
    data() {
        return {}
    },
}
</script>