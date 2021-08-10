import {blue, green, red, white, yellow} from 'chalk';

export const fileName = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const time = `${date.getTime()}`;
    return `${year}_${month}_${day}_${time}`;
};

export enum MessageType {
    warn = 'warn',
    info = 'info',
    error = 'error',
    success = 'success'
}

export const logger = (messageType: MessageType, message: string, data?: any) => {
    let color = white;

    switch (messageType) {
        case MessageType.success:
            color = green;
            break;
        case MessageType.info:
            color = blue;
            break;
        case MessageType.error:
            color = red;
            break;
        case MessageType.warn:
            color = yellow;
            break;
        default:
            color = white;
    }

    console.log(color(message));
};
