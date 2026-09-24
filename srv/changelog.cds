using { vanstock } from '../db/vanstock-header';
using from '../db/vanstock-changelog';
using from '../db/vanstock-archive';
using { VanStockProfile } from './vanstock-service';


annotate VanStockProfile.ChangeLog     with @readonly;
annotate VanStockProfile.ArchiveHeader with @readonly;
annotate VanStockProfile.ArchiveLine   with @readonly;

// Link each profile to its change history (no DB column - join on engineer)
extend vanstock.VanStockProfileHeader with {
    changeLogs : Association to many vanstock.ChangeLogs
                     on changeLogs.engineerId = engineerId;
}