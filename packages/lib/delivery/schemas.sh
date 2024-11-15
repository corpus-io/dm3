yarn ts-json-schema-generator -f tsconfig.json --path Delivery.ts --type DeliveryServiceProperties -o ./src/schema/DeliveryServiceProperties.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path Messages.ts --type Acknowledgement -o ./src/schema/Acknowledgement.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path Account.ts --type Account -o ./src/schema/Account.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path notifications/types.ts --type NotificationChannel -o ./src/schema/NotificationChannel.schema.json --no-type-check \
