import {Types} from './models';

export const roleExists = (role) => {
    return Object.values(Types).includes(role);
};

export const isAdminRole = (role) => {
    return [Types.admin, Types.adminReader].includes(role);
};

export const isAdminReader = (role) => {
    return isAdminRole(role);
};