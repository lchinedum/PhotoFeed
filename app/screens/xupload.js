import React from 'react';
import { TextInput, ActivityIndicator,TouchableOpacity, FlatList, StyleSheet, Text, View, Image } from 'react-native';
import {f, auth, database, storage } from '../../config/config.js';
//import { Permissions, ImagePicker } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';


class upload extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            loggedin: false,
            imageId:this.uniqueId(),
            imageSelected: false,
            uploading:false,
            caption:'',
            progress: 0
        }
    //alert(this.uniqueId());
    }

    _checkPermissions = async () => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({camera:status});

        const { statusRoll } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        this.setState({cameraROLL:statusRoll});

    }
    s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    uniqueId = () => {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
        this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4();
    }

    findNewImage = async () => {
        this._checkPermissions();

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes:'Images',
            allowsEditing: true,
            quality:1
        });
        console.log(result);
        if(!result.cancelled){
            console.log('Upload image');
            //this.uploadImage(result.uri);
            this.setState({
                imageSelected: true,
                imageId: this.uniqueId(),
                uri: result.uri
            })

        }else{
            console.log('cancel');
            this.setState({
                imageSelected:false
            });
        }
    }
    uploadPublish = () =>{
        if(this.state.uploading == false){
            
                if(this.state.caption != ''){
                    //
                    this.uploadImage(this.state.uri)
                }else{
                    alert('Please enter a caption..')
                }
        }else{
            console.log('Ignore button tap as already uploading');
            }
    }
    uploadImage = async (uri) => {
        //
        var that = this;
        var userid = f.auth().currentUser.uid;
        var imageId = this.state.imageId;

        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(uri)[1];
        this.setState({ 
            currentFileType: ext,
            uploading:true 
        });
        
        const response = await fetch(uri);
        const blob = await response.blob();
        var FilePath = imageId+'.'+that.state.currentFileType;

        var uploadTask = storage.ref('user/'+userid+'/img').child(FilePath).put(blob);
        
            uploadTask.on('state_changed', function(snapshot){
            var progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(0);
            console.log('Upload is '+progress+'% complete');
            that.setState({
                progress:progress,
            });
        }, function(error){
            console.log('error with upload -'+error);
        }, function(){
            //complete
            that.setState({ progress:100});
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL){
                console.log(downloadURL);
                //alert(downloadURL);
                that.processUpload(downloadURL);
            });
        });
        /* var snapshot = ref.put(blob).on('state_changed', snapshot => {
            console.log('Progress', snapshot.bytesTransferred, snapshot.totalBytes);
        });*/
    }

    processUpload = (imageUrl) => {
        //processing here

        //Build photo objectFit: 
        //author,caption,posted,url 
        
        //set needed info
        var imageId = this.state.imageId;
        var userId = f.auth().currentUser.uid;
        var caption = this.state.caption;
        var dateTime = Date.now();
        var timestamp = Math.floor(dateTime / 1000);

        var photoObj = {
            author: userId,
            caption: caption,
            posted: timestamp,
            url:imageUrl
        };
        //Update the database

        //Add to main feed 
        database.ref('/photos/'+imageId).set(photoObj);
        database.ref('/users/'+userId+'/photos/'+imageId).set(photoObj);

        alert('Image uploaded')
        this.setState({
            uploading:false,
            imageSelected:false,
            caption:'',
            uri:''
        });
    }

    componentDidMount = () =>{
        var that = this;
        f.auth().onAuthStateChanged(function(user){
            if(user){
                //logged in
                that.setState({
                    loggedin:true
                });
            }else{
                //no logged in
                that.setState({
                    loggedin:false
                });
            }
        });
    }

    render(){
        return(
            <View style={{ flex: 1}}>
                { this.state.loggedin == true ? (
                    //are logged in 
                    <View style={{flex: 1}}>
                    { this.state.imageSelected == true ? (
                        <View style={{flex: 1}}>
                            <View style={{ height:70, paddingTop:30, backgroundColor: 'white', borderColor: 'lightgrey', borderBottomWidth: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                            <Text>Upload</Text>
                            </View>
                            <View style={{padding: 5}}> 
                                <Text style={{marginTop: 5}}>Caption</Text>
                                <TextInput
                                    editable={true}
                                    placeholder={'Enter your Caption...'}
                                    maxLength={150}
                                    multiline={true}
                                    numberOfLine={4}
                                    onChangeText={(text) => this.setState({caption:text})}
                                    style={{marginVertical:10, height: 100, padding: 5, borderColor: 'grey', borderWidth: 1,borderRadius: 3, backgroundColor: 'white', color: 'black'}}
                                />
                                <TouchableOpacity
                                onPress={() => this.uploadPublish()}
                                style={{alignSelf: 'center', width: 170, marginHorizontal:'auto', backgroundColor: 'purple', borderRadius: 5, paddingVertical:10, paddingHorizontal:20}}>
                                    <Text style={{textAlign: 'center', color: 'white',}}>Upload & Publish</Text>
                                </TouchableOpacity>
                                {this.state.uploading == true ? (
                                    <View style={{marginTop: 10}}>
                                    <Text>{this.state.progress}%</Text>
                                    { this.state.progress != 100 ?(
                                        <ActivityIndicator size="small" color="blue" />
                                    ) : ( 
                                    <Text>Processing</Text>
                                    )}
                                    </View>
                                ):(
                                    <View></View>
                                )}
                                <Image
                                source={{uri: this.state.uri}}
                                style={{marginTop: 10, resizeMode:'cover', width: '100%', height: 275}}
                                />
                            </View>
                        </View>
                    ) : ( 
                        <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{ fontSize:28, paddingBottom:15 }}> Upload</Text>
                            <TouchableOpacity
                            onPress={() => this.findNewImage()}
                            style={{paddingVertical:10, paddingHorizontal:20, backgroundColor: 'blue', borderRadius: 5 }}>
                                <Text style={{color: 'white'}}> Select Photo</Text>
                            </TouchableOpacity>    
                        </View>
                    )}
                    </View>   
                ):(
                    //not logged in
                    <View style={{flex:1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text> You are not logged in</Text>
                        <Text>Please login to upload photo</Text>
                    </View>
                )}
            </View>
        )
    }



}

export default upload;

