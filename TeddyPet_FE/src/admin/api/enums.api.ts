import { apiApp } from '../../api';
import Cookies from 'js-cookie';
import { ApiResponse } from '../config/type';

const withAuth = () => ({
    headers: {
        Authorization: `Bearer ${Cookies.get('tokenAdmin')}`,
    },
});

export const getPetTypes = async (): Promise<ApiResponse<string[]>> => {
    const response = await apiApp.get('/api/enums/pet-types', withAuth());
    return response.data;
};

