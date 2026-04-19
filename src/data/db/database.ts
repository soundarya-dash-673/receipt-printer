// Explicit imports keep `hashPin` and `getDatabase` correct when webpack aliases `database.native` → web.
import {hashPin} from './databaseShared';
import {getDatabase} from './database.native';

export {hashPin, getDatabase};
