yarn ts-json-schema-generator -f tsconfig.json --path Delivery.ts --type DeliveryServiceProperties -o ./src/schema/DeliveryServiceProperties.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path Messages.ts --type Acknoledgment -o ./src/schema/Acknoledgment.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path Messages.ts --type MessageSubmission -o ./src/schema/MessageSubmission.schema.json --no-type-check \
&& yarn ts-json-schema-generator -f tsconfig.json --path Session.ts --type Session -o ./src/schema/Session.schema.json --no-type-check \

