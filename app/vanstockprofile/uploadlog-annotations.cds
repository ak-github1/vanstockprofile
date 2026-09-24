using VanStockProfile as service from '../../srv/vanstock-service';

annotate service.UploadLog with @(
    UI.HeaderInfo: {
        TypeName: 'Upload Log',
        TypeNamePlural: 'Upload Logs',
        Title: { Value: partNumber }
    },

    UI.LineItem: [
        { Value: rowNumber,    Label: 'Row' },
        { Value: engineerId,   Label: 'Engineer ID' },
        { Value: profitCenter, Label: 'Profit Center' },
        { Value: partNumber,   Label: 'Part Number' },
        { Value: quantity,     Label: 'Quantity' },
        { Value: value,        Label: 'Value' },
        { Value: status,       Label: 'Status' },
        { Value: remark,       Label: 'Remark' },
        { Value: uploadedOn,   Label: 'Uploaded On' },
        { Value: uploadedBy,   Label: 'Uploaded By' }
    ],

    // Default sort: latest upload first, then Row 2, 3, 4 ... within that upload
    UI.PresentationVariant: {
        SortOrder: [
            { Property: uploadedOn, Descending: true },
            { Property: rowNumber,  Descending: false }
        ],
        Visualizations: [ '@UI.LineItem' ]
    },

    // Filter bar of the Upload Logs page
    UI.SelectionFields: [
        engineerId,
        partNumber,
        profitCenter
    ]
);

// Labels shown on the filter fields
annotate service.UploadLog with {
    engineerId   @Common.Label: 'Engineer ID';
    partNumber   @Common.Label: 'Part Number';
    profitCenter @Common.Label: 'Profit Center';
};