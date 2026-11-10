import { useHdf5Dataset, useHdf5Group } from "@hdf5Interface";
import { EmptyState, LoadingState } from "@ui";
import { neurodataTypeInheritsFrom } from "../../neurodataTypeInheritance";
import { useNwbFileSpecifications } from "../../SpecificationsView/SetupNwbFileSpecificationsProvider";
import ImagesItemView, { ImageItem } from "./ImagesItemView";

type Props = {
  nwbUrl: string;
  path: string;
  objectType: "group" | "dataset";
  width?: number;
  height?: number;
};

const ImagePluginView: React.FC<Props> = ({
  nwbUrl,
  path,
  objectType,
  width,
  height,
}) => {
  if (objectType === "dataset") {
    return (
      <ImagePluginViewDataset
        nwbUrl={nwbUrl}
        path={path}
        objectType={objectType}
        width={width}
        height={height}
      />
    );
  } else {
    return (
      <ImagePluginViewGroup
        nwbUrl={nwbUrl}
        path={path}
        objectType={objectType}
        width={width}
        height={height}
      />
    );
  }
};

const ImagePluginViewDataset: React.FC<Props> = ({ nwbUrl, path }) => {
  const dataset = useHdf5Dataset(nwbUrl, path);
  const specifications = useNwbFileSpecifications();
  if (!dataset)
    return <LoadingState label="Reading the image" phase="loading" />;
  const neurodataType = dataset.attrs.neurodata_type;
  if (neurodataTypeInheritsFrom(neurodataType, "Image", specifications)) {
    return (
      <ImageItem nwbUrl={nwbUrl} path={path} neurodataType={neurodataType} />
    );
  } else {
    return (
      <EmptyState title="Not an image">
        {`Neurosift can’t draw ${neurodataType} as an image.`}
      </EmptyState>
    );
  }
};

const ImagePluginViewGroup: React.FC<Props> = ({
  nwbUrl,
  path,
  width,
  height,
}) => {
  const group = useHdf5Group(nwbUrl, path);
  const specifications = useNwbFileSpecifications();
  if (!group)
    return <LoadingState label="Reading the images" phase="loading" />;
  const neurodataType = group.attrs.neurodata_type;
  if (neurodataTypeInheritsFrom(neurodataType, "Images", specifications)) {
    return (
      <ImagesItemView
        nwbUrl={nwbUrl}
        path={path}
        width={width || 800}
        height={height || 800}
      />
    );
  } else {
    return (
      <EmptyState title="Not an image">
        {`Neurosift can’t draw ${neurodataType} as an image.`}
      </EmptyState>
    );
  }
};

export default ImagePluginView;
