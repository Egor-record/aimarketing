<template>
    <div class="container">
        <h1>Админ панель</h1>
        <div class="table-responsive mt-5">
            <table 
                v-if="!errorLoading"    
                class="table table-striped table-hover table-bordered text-center">
                <thead class="table-dark">
                    <tr>
                        <th scope="col">Telegram ID</th>
                        <th scope="col">Чат ID</th>
                        <th scope="col">Создан</th>
                        <th scope="col">Свой ключ</th>
                        <td scope="col">Оплачен до</td>
                        <th scope="col">Остаток токенов</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in users" :key="user.id">
                        <td>{{ user.telegramID }}</td>
                        <td>{{ user.aiMarketing.chatID }}</td>
                        <td>{{ formatDate(user.createData) }}</td>
                        <td>{{ user.aiMarketing.isUsingOwnKey ? 'Да' : 'Нет' }}</td>
                        <td>{{ formatDate(user.aiMarketing.paidUntil)}}</td>
                        <td>{{ user.aiMarketing.tokens }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-else>
                Ошибка загрузки таблицы
            </div>
        </div>
    </div>
  </template>
  <script>

  export default {
    name: 'UsersTable',
    data() {
        return {
            users: [],
            errorLoading: false
        };
    },
    async created() {
        try {
            const response = await fetch('/api/v1/users');
            this.users = await response.json();
        } catch (error) {
            this.errorLoading = true
            console.error('Error fetching users:', error);
        }
    },
    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },

    },
  }
  </script>