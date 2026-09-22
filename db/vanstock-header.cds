namespace vanstock;

entity VanStockProfileHeader {
    key ID           : UUID;
        engineerId   : String(20);
        businessUnit : String(10);
        dateCreated  : Date;
        status       : String(10) default 'Active';
        lines        : Composition of many VanStockProfileLine on lines.header = $self;
}

entity VanStockProfileLine {
    key ID           : UUID;
        header       : Association to VanStockProfileHeader;
        productGroup  : String(10);
        productStatus : String(10);
        partNumber    : String(40);
        quantity      : Decimal(13,3);
        baseUOM       : String(3);
        value         : Decimal(15,2);
}