import { LoadingState, Slider, ViewPanel } from "@ui";
import { useCssVars } from "@components/useCssVars";
import {
  FunctionComponent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./ImagesItemView.css";
import { galleryImages } from "./imageGallery";
import { useInView } from "react-intersection-observer";
import {
  Hdf5Dataset,
  useHdf5Dataset,
  useHdf5DatasetData,
  useHdf5Group,
} from "@hdf5Interface";
import { DatasetDataType } from "@remote-h5-file";
import { getNeurodataTypeAncestry } from "../../neurodataTypeInheritance";
import { useNwbFileSpecifications } from "../../SpecificationsView/SetupNwbFileSpecificationsProvider";
import ViewError from "@components/ViewError/ViewError";

type Props = {
  width: number;
  height: number;
  nwbUrl: string;
  path: string;
  condensed?: boolean;
};

const ImagesItemView: FunctionComponent<Props> = ({ nwbUrl, path }) => {
  const group = useHdf5Group(nwbUrl, path);
  const {
    images,
    width: imageWidth,
    height: imageHeight,
  } = useMemo(() => galleryImages(group?.datasets ?? []), [group]);
  if (!group)
    return <LoadingState label="Reading the images" phase="loading" />;
  const n = images.length;
  return (
    <ViewPanel
      label={path.split("/").pop() || path}
      summary={`${n.toLocaleString("en-US")} image${n === 1 ? "" : "s"}, up to ${imageWidth.toLocaleString("en-US")} × ${imageHeight.toLocaleString("en-US")} px`}
      controls={null}
    >
      <Gallery width={imageWidth} height={imageHeight}>
        {images.map((ds) => (
          <figure key={ds.path} className="images-item">
            <LazyFrame>
              <ImageItem
                nwbUrl={nwbUrl}
                path={ds.path}
                neurodataType={ds.attrs["neurodata_type"]}
              />
            </LazyFrame>
            <figcaption className="images-name">{ds.name}</figcaption>
          </figure>
        ))}
      </Gallery>
    </ViewPanel>
  );
};

/** Images side by side as thumbnails, up to 240px wide each, in the images' shape. */
const Gallery: FunctionComponent<{
  width: number;
  height: number;
  children: ReactNode;
}> = ({ width, height, children }) => {
  const ref = useCssVars<HTMLDivElement>({
    "--image-min": Math.min(width, 240) || 240,
    "--image-ratio": width && height ? `${width} / ${height}` : "1",
  });
  return (
    <div ref={ref} className="images-gallery">
      {children}
    </div>
  );
};

/** Reads and draws an image only once it scrolls into view. */
const LazyFrame: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const { inView, ref } = useInView({ triggerOnce: true });
  return (
    <div ref={ref} className="images-frame">
      {inView && children}
    </div>
  );
};

type ImageItemProps = {
  nwbUrl: string;
  path: string;
  neurodataType: string;
};

const coreImageTypes = ["GrayscaleImage", "RGBImage", "RGBAImage", "Image"];

export const ImageItem: FunctionComponent<ImageItemProps> = ({
  nwbUrl,
  path,
  neurodataType,
}) => {
  const dataset = useHdf5Dataset(nwbUrl, path);
  const { data, errorMessage } = useHdf5DatasetData(nwbUrl, path);
  const specifications = useNwbFileSpecifications();
  // Resolve to the nearest core image type in the inheritance chain, so that
  // extension subtypes (e.g. a type extending RGBImage) get the visualization
  // of their closest supported ancestor.
  const resolvedType = useMemo(() => {
    const ancestry = getNeurodataTypeAncestry(neurodataType, specifications);
    return ancestry.find((t) => coreImageTypes.includes(t));
  }, [neurodataType, specifications]);
  if (errorMessage) {
    return <ViewError what="the images" error={errorMessage} />;
  }
  if (!dataset || !data)
    return <LoadingState label="Reading the image" phase="loading" />;

  if (resolvedType === "GrayscaleImage") {
    return <GrayscaleImageItem dataset={dataset} data={data} />;
  } else if (resolvedType === "RGBImage") {
    return <RGBImageItem dataset={dataset} data={data} />;
  } else if (resolvedType === "RGBAImage") {
    return <RGBAImageItem dataset={dataset} data={data} />;
  } else {
    // "Image" or unknown: infer from the dataset shape
    return <RegularImageItem dataset={dataset} data={data} />;
  }
};

type GrayscaleImageItemProps = {
  dataset: Hdf5Dataset;
  data: DatasetDataType;
};

const GrayscaleImageItem: FunctionComponent<GrayscaleImageItemProps> = ({
  dataset,
  data,
}) => {
  const H = dataset.shape[0];
  const W = dataset.shape[1];

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  );

  const [brightness, setBrightness] = useState<number>(50); // brightness between -0 and 100
  const [contrast, setContrast] = useState<number>(50); // contrast between 0 and 100

  const maxVal = useMemo(() => {
    let ret = 0;
    for (let i = 0; i < W * H; i++) {
      const val = data[i];
      if (val > ret) ret = val;
    }
    return ret;
  }, [data, W, H]);

  const { windowMin, windowMax } = useMemo(() => {
    // brightness 50 and contrast 50 corresponds to windowMin 0 and windowMax maxVal
    const contrastScale = Math.exp(((contrast - 50) / 50) * Math.log(10));
    let windowMin = maxVal / 2 - maxVal / 2 / contrastScale;
    let windowMax = maxVal / 2 + maxVal / 2 / contrastScale;
    windowMin = windowMin - ((brightness - 50) / 50) * maxVal;
    windowMax = windowMax - ((brightness - 50) / 50) * maxVal;
    return { windowMin, windowMax };
  }, [maxVal, brightness, contrast]);

  useEffect(() => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(W, H);
    const buf = imageData.data;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const val = data[i + j * W];
        const ind = (i + j * W) * 4;
        const v = Math.min(
          Math.max(0, ((val - windowMin) / (windowMax - windowMin)) * 255),
          255,
        );
        buf[ind + 0] = v;
        buf[ind + 1] = v;
        buf[ind + 2] = v;
        buf[ind + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [canvasElement, W, H, data, maxVal, windowMin, windowMax]);

  return (
    <div>
      <canvas ref={(elmt) => setCanvasElement(elmt)} width={W} height={H} />
      <div className="images-controls">
        <Slider
          label="Brightness"
          min={0}
          max={100}
          step={1}
          showValue
          showField={false}
          value={brightness}
          onChange={setBrightness}
        />
        <Slider
          label="Contrast"
          min={0}
          max={100}
          step={1}
          showValue
          showField={false}
          value={contrast}
          onChange={setContrast}
        />
      </div>
    </div>
  );
};

type RegularImageItemProps = {
  dataset: Hdf5Dataset;
  data: DatasetDataType;
};

const RegularImageItem: FunctionComponent<RegularImageItemProps> = ({
  dataset,
  data,
}) => {
  if (dataset.shape.length === 2) {
    // I guess this is just a grayscale image
    return <GrayscaleImageItem dataset={dataset} data={data} />;
  } else if (dataset.shape.length === 3 && dataset.shape[2] === 3) {
    // I guess this is an RGB image
    return <RGBImageItem dataset={dataset} data={data} />;
  } else if (dataset.shape.length === 3 && dataset.shape[2] === 4) {
    // I guess this is an RGBA image
    return <RGBAImageItem dataset={dataset} data={data} />;
  } else {
    return (
      <div>Image not supported with shape: {dataset.shape.join(", ")}</div>
    );
  }
};

type RGBImageItemProps = {
  dataset: Hdf5Dataset;
  data: DatasetDataType;
};

const RGBImageItem: FunctionComponent<RGBImageItemProps> = ({
  dataset,
  data,
}) => {
  const H = dataset.shape[0];
  const W = dataset.shape[1];

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  );

  useEffect(() => {
    if (dataset.shape.length !== 3) {
      console.error("Unexpected dataset shape for RGB image: ", dataset.shape);
      return;
    }
    if (dataset.shape[2] !== 3) {
      console.error(
        "Unexpected number of channels for RGB image: ",
        dataset.shape[2],
      );
      return;
    }
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(W, H);
    const buf = imageData.data;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const v1 = data[(i + j * W) * 3 + 0];
        const v2 = data[(i + j * W) * 3 + 1];
        const v3 = data[(i + j * W) * 3 + 2];
        const ind = (i + j * W) * 4;
        buf[ind + 0] = v1;
        buf[ind + 1] = v2;
        buf[ind + 2] = v3;
        buf[ind + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [canvasElement, W, H, dataset, data]);

  return <canvas ref={(elmt) => setCanvasElement(elmt)} width={W} height={H} />;
};

type RGBAImageItemProps = {
  dataset: Hdf5Dataset;
  data: DatasetDataType;
};

const RGBAImageItem: FunctionComponent<RGBAImageItemProps> = ({
  dataset,
  data,
}) => {
  const H = dataset.shape[0];
  const W = dataset.shape[1];

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  );

  useEffect(() => {
    if (dataset.shape.length !== 3) {
      console.error("Unexpected dataset shape for RGBA image: ", dataset.shape);
      return;
    }
    if (dataset.shape[2] !== 4) {
      console.error(
        "Unexpected number of channels for RGBA image: ",
        dataset.shape[2],
      );
      return;
    }
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.createImageData(W, H);
    const buf = imageData.data;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const v1 = data[(i + j * W) * 4 + 0];
        const v2 = data[(i + j * W) * 4 + 1];
        const v3 = data[(i + j * W) * 4 + 2];
        const v4 = data[(i + j * W) * 4 + 3];
        const ind = (i + j * W) * 4;
        buf[ind + 0] = v1;
        buf[ind + 1] = v2;
        buf[ind + 2] = v3;
        buf[ind + 3] = v4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [canvasElement, W, H, dataset, data]);

  return <canvas ref={(elmt) => setCanvasElement(elmt)} width={W} height={H} />;
};

export default ImagesItemView;
