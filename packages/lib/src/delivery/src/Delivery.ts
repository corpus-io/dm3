export interface DeliveryServiceProperties {
    messageTTL: number;
    //Number of bytes an envelop object should not exceed
    sizeLimit: number;
}
