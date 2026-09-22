namespace vanstock;

entity ArchiveHeaders {
    key ID           : UUID;
        dateArchived : Date;
        timeArchived : Time;
        dateCreated  : Date;
        engineerId   : String(20);
        businessUnit : String(10);
        status       : String(10);
        lines        : Composition of many ArchiveLines on lines.archiveHeader = $self;
}

entity ArchiveLines {
    key ID            : UUID;
        archiveHeader : Association to ArchiveHeaders;
        productGroup  : String(10);
        productStatus : String(10);
        partNumber    : String(40);
        quantity      : Decimal(13,3);
        baseUOM       : String(3);
        value         : Decimal(15,2);
}