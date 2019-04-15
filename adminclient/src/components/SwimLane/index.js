import React, { Component, PropTypes, } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ResponsiveCard from '../ResponsiveCard';
import ResponsiveButton from '../ResponsiveButton';
import { getRenderedComponent, } from '../AppLayoutMap';
import numeral from 'numeral';
import { Card, CardHeader, CardHeaderIcon, CardContent, CardHeaderTitle, Image } from 're-bulma';
// import console = require('console');

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (prevState, source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = prevState;
    result[droppableSource.droppableId].items = sourceClone;
    result[droppableDestination.droppableId].items = destClone;
    return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle, styleOptions) => {
    // some basic styles to make the items look a bit nicer
    return Object.assign({
        userSelect: 'none',
        padding: grid * 2,
        margin: `0 0 ${grid}px 0`,
        background: isDragging ? styleOptions.dragBackground : styleOptions.nonDragBackground,
    }, styleOptions, draggableStyle)
};

const getListStyle = (isDraggingOver, styleOptions) => {
    return Object.assign({
        background: isDraggingOver ? styleOptions.dragBackground : styleOptions.nonDragBackground,
        padding: grid,
        width: 250,
        display: 'inline-block',
    }, styleOptions)
};

class SwimLane extends Component {
    constructor(props) {
        super(props);
        this.state = {
            droppableList: this.props.droppableList,
            headerInfo: {},
        };
        this.getRenderedComponent = getRenderedComponent.bind(this);
        this.getList = this.getList.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    getList(id) {
        return this.state.droppableList[id].items;
    } 

    componentWillMount() {
        this.updateHeaderInfo();
    }

    updateHeaderInfo() {
        let newHeaderInfo = this.state.headerInfo;
        this.state.droppableList.map((listItem, idx) => {
            let newAmount = listItem.items.reduce(function (a, b) {
                return a + b.amountNum;
            }, 0);
            newHeaderInfo[idx] = `${listItem.items.length} for ${numeral(newAmount).format('$0,0')}`;
        })
        this.setState({headerInfo: newHeaderInfo});
    }

    onDragEnd(result) {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }
        if (source.droppableId !== destination.droppableId) {
            const token = localStorage.getItem('Admin Panel_jwt_token');
            let fetchUrl = this.props.fetchOptions && this.props.fetchOptions.url ? this.props.fetchOptions.url : '';
            fetchUrl = fetchUrl.includes('?')
                ? `${fetchUrl}&access_token=${token}`
                : `${fetchUrl}?access_token=${token}`;
            if (fetchUrl.indexOf(':id') !== -1) fetchUrl = fetchUrl.replace(/:id/, result.draggableId)
            const fetchOptions = this.props.fetchOptions && this.props.fetchOptions.options ? this.props.fetchOptions.options : {};
            const droppableList = move(
                this.state.droppableList,
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );
            let body = {};
            body[ 'entity_id' ] = result.draggableId;
            body[ 'source_idx' ] = source.droppableId;
            body[ 'destination_idx' ] = destination.droppableId;
            this.setState({ droppableList }, () => {
                if (fetchUrl) {
                    fetch(fetchUrl, Object.assign(fetchOptions, { body: JSON.stringify(body) }))
                }
            });
            this.updateHeaderInfo();
        }
    };
    render() {
        const itemStyle = this.props.itemProps && this.props.itemProps.style ? this.props.itemProps.style : {};
        const imageStyle = this.props.imageStyle ? this.props.imageStyle : {};
        const contextStyle = this.props.contextProps && this.props.contextProps.style ? this.props.contextProps.style : {};
        const droppableListStyle = this.props.droppableListProps && this.props.droppableListProps.style ? this.props.droppableListProps.style : {};
        const droppableProps = this.props.droppableListProps ? this.props.droppableListProps : {};
        const draggableStyle = this.props.draggableProps && this.props.draggableProps.style ? this.props.draggableProps.style : {};
        const contextProps = this.props.contexProps ? this.props.contextProps : {};
        const titleTextStyle = this.props.itemTitleProps && this.props.itemTitleProps.style ? this.props.itemTitleProps.style : {};
        const titleButtonProps = this.props.itemTitleProps && this.props.itemTitleProps.buttonProps ? this.props.itemTitleProps.buttonProps : {};

        const droppables = this.state.droppableList.map((listItem, idx) =>
            <Card {...listItem.cardProps.cardProps} isFullwidth>
            <CardHeader style={Object.assign({ cursor:'pointer', }, listItem.cardProps.headerStyle)}>
            <CardHeaderTitle style={listItem.cardProps.headerTitleStyle}>
                {(!listItem.cardProps.cardTitle || typeof listItem.cardProps.cardTitle ==='string')? listItem.cardProps.cardTitle
                : this.getRenderedComponent(listItem.cardProps.cardTitle)}
                <div {...listItem.headerInfoProps}>{this.state.headerInfo[idx]}</div>
            </CardHeaderTitle>
            </CardHeader>
            <CardContent {...listItem.cardProps.cardContentProps}>
                <Droppable {...droppableProps} droppableId={`${idx}`}>
                {(provided, snapshot) => <div
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver, droppableListStyle)}>
                    {listItem.items.map((item, index) => {
                        return (<Draggable
                            key={`item-${idx}-${index}`}
                            draggableId={item.id}
                            index={index}
                            >
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style,
                                        draggableStyle
                                    )}>
                                    <div style={Object.assign({display:'flex', alignItems: 'center'},)}>
                                        <span style={Object.assign({
                                            width: '25px', 
                                            height: '25px', 
                                            borderRadius: '100px', 
                                            background: '#ccc', 
                                            flex:'none', 
                                            backgroundSize: 'cover',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundImage: (item.image) ? `url(${item.image})` : undefined,
                                            marginRight: '8px'
                                            }, imageStyle)} >
                                        </span>
                                        <ResponsiveButton {...Object.assign({}, this.props, titleButtonProps, { onclickPropObject: item } )} style={Object.assign({border:'none'}, titleTextStyle)}>{item.itemName}</ResponsiveButton>
                                    </div>
                                    <div style={Object.assign({display:'flex',justifyContent: 'space-between'}, itemStyle)}>
                                        <span>{item.amount}</span>
                                        <span>{item.date}</span>
                                    </div>
                                </div>
                            )}
                        </Draggable>)
                    })}
                    {provided.placeholder}
                    </div>}
                </Droppable>
            </CardContent>
        </Card>)
        return (
            <DragDropContext {...contextProps} onDragEnd={this.onDragEnd}>
                <div style={Object.assign({display:'flex'}, contextStyle)}>
                {droppables}
                </div>
            </DragDropContext>
        );
    }
}

const propTypes = {};

SwimLane.propTypes = propTypes;
SwimLane.defaultProps = {};

export default SwimLane;