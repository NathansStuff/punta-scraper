// eslint-disable-next-line simple-import-sort/imports
import 'src/config'; // This line MUST remain as the first import as it loads env
import { PORT } from 'src/constants';

import app from './app';

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});
