<template>
    <div>
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
                    <td>
                        <span v-if="!user.isEditingPaidUntil" @click="togglePaidUntilInput(user)">
                            {{ formatDate(user.aiMarketing.paidUntil)}}
                        </span>
                        <span v-else>
                            <input 
                                v-model="user.aiMarketing.formattedPaidUntil"
                                type="date" 
                                @blur="updatePaidUntil(user)" 
                                @keyup.enter="updatePaidUntil(user)"
                            />
                        </span>
                    </td>
                    <td>
                        <span v-if="!user.isEditingTokens" @click="toggleTokenInput(user)">
                            {{ user.aiMarketing.tokens }}
                        </span>
                        <span v-else>
                            <input 
                                v-model.number="user.aiMarketing.tokens" 
                                type="number" 
                                @blur="updateToken(user)" 
                                @keyup.enter="updateToken(user)"
                            />
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-else>
            Ошибка загрузки таблицы
        </div>
    </div>
</template>
<script>
import { useAuthStore } from '@/store/auth';
import api from '@/utils/api';
const PATH = '/api/v1/users';
  export default {
    name: 'AdminTable',
    data() {
        return {
            users: [],
            errorLoading: false
        };
    },
    async created() {
        try {
            const response = await api.get(PATH)
            this.users = response.data
            this.users = response.data.map(user => ({
                ...user,
                isEditingTokens: false,
                isEditingPaidUntil: false,
            }));
        } catch (error) {
            this.errorLoading = true
            if (error.response && error.response.status === 403) {
                useAuthStore().logout()
                this.$router.push('/login');
            }
        }
    },
    methods: {
        formatDate (dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
        toggleTokenInput (user) {
            user.isEditingTokens = !user.isEditingTokens;
        },
        togglePaidUntilInput (user) {
            user.isEditingPaidUntil = !user.isEditingPaidUntil;
            if (user.isEditingPaidUntil) {
                user.aiMarketing.formattedPaidUntil = this.formatDateForInput(user.aiMarketing.paidUntil);
            }
        },
        formatDateForInput(isoDate) {
            if (!isoDate) return '';
            const date = new Date(isoDate);
            return date.toISOString().split('T')[0];
        },
        async updatePaidUntil(user) {
            const newDate = user.aiMarketing.formattedPaidUntil;
            if (newDate) {
                user.aiMarketing.paidUntil = new Date(newDate).toISOString();
            }
            user.isEditingPaidUntil = false;

            await this.updateUserValue(user, "paidUntil");
        },
        async updateToken (user) {
            this.toggleTokenInput(user),
            await this.updateUserValue(user, "tokens")
        },
        async updateUserValue (user, valueName, service = "aiMarketing") {
            try {
                const response = await api.put(`${PATH}/${user.telegramID}/${valueName}`, {
                    value: user[service][valueName],
                    service: service
                });
                if (response.status !== 200) {
                    console.error('Error updating tokens:');
                }
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    useAuthStore().logout();
                    this.$router.push('/login');
                } else {
                    console.error('Error updating tokens:', error);
                }
            }
        }
    },
  }
  </script>