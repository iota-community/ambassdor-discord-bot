import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { ambassadorSchema } from './embassador_schema';

addRxPlugin(RxDBDevModePlugin);

const ambassadorDB = await createRxDatabase({
    name: 'ambassadors',
    storage: getRxStorageDexie()
});

await ambassadorDB.addCollections({
    ambassadors: {
    schema: ambassadorSchema
    }
});